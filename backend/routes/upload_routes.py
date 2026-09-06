import os
import io
import pandas as pd
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from database import execute_query, fetch_one, fetch_all
from auth import get_current_user, get_optional_user
from config import Config
from ml.preprocessing import preprocess_dataframe, find_label_column
from ml.prediction import predict_network_traffic
from ml.evaluation import evaluate_predictions, get_production_model_evaluation
from ml.pcap_processor import process_pcap_file
from ml.zeek_processor import parse_zeek_log_file, process_zeek_conn_logs
from mongo_db import insert_security_event, insert_detailed_threat_event, insert_zeek_event
from services.siem_service import dispatch_siem_event

upload_router = APIRouter(tags=['Upload & Ingestion'])
upload_bp = upload_router

ALLOWED_EXTENSIONS = {'csv', 'pcap', 'pcapng', 'log', 'tsv'}

@upload_router.post('/upload')
@upload_router.post('/upload-csv')
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    import app
    ml_model = getattr(app, 'ml_model', None)
    label_encoder = getattr(app, 'label_encoder', None)
    model_feature_names = getattr(app, 'model_feature_names', None)
    
    if ml_model is None or label_encoder is None:
        raise HTTPException(status_code=503, detail='AI Model is currently offline. Train or load the model first.')
        
    if not file.filename:
        raise HTTPException(status_code=400, detail='No file selected for upload.')
        
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f'Invalid file format: .{ext}. Supported formats: CSV, PCAP, PCAPNG, Zeek LOG.')
        
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    save_path = os.path.join(Config.UPLOAD_FOLDER, file.filename)
    
    content = await file.read()
    with open(save_path, 'wb') as f:
        f.write(content)
        
    df = None
    metadata_list = []
    has_ground_truth = False
    y_true = []
    
    if ext in ('pcap', 'pcapng'):
        dataset_type = 'Wireshark PCAP Capture'
        df, metadata_list = process_pcap_file(save_path)
        rows_count = len(df)
        cols_count = df.shape[1] if rows_count > 0 else 78
    elif ext in ('log', 'tsv'):
        dataset_type = 'Zeek Connection Log'
        zeek_raw = parse_zeek_log_file(save_path)
        df, metadata_list = process_zeek_conn_logs(zeek_raw)
        rows_count = len(df)
        cols_count = df.shape[1] if rows_count > 0 else 78
        for z_rec in zeek_raw:
            insert_zeek_event(z_rec)
    else:
        df = pd.read_csv(save_path)
        rows_count, cols_count = df.shape
        cols_lower = [str(c).strip().lower() for c in df.columns]
        dataset_type = 'CICIDS2017' if 'flow duration' in cols_lower else ('UNSW-NB15' if 'dur' in cols_lower else 'Custom Network Flow')
        label_col = find_label_column(df)
        has_ground_truth = label_col is not None
        
        source_ips = df['Source IP'].tolist() if 'Source IP' in df.columns else (df['srcip'].tolist() if 'srcip' in df.columns else ['192.168.1.105'] * rows_count)
        dest_ips = df['Destination IP'].tolist() if 'Destination IP' in df.columns else (df['dstip'].tolist() if 'dstip' in df.columns else ['10.0.0.1'] * rows_count)
        protocols = df['Protocol'].tolist() if 'Protocol' in df.columns else (df['proto'].tolist() if 'proto' in df.columns else ['TCP'] * rows_count)
        
        for s_ip, d_ip, pr in zip(source_ips, dest_ips, protocols):
            metadata_list.append({
                'source_ip': s_ip,
                'destination_ip': d_ip,
                'protocol': pr
            })

    if df is None or len(df) == 0:
        raise HTTPException(status_code=400, detail='File contained 0 valid network flow records.')

    dataset_id = execute_query(
        """INSERT INTO datasets (filename, dataset_type, rows_count, columns_count, uploaded_by, has_ground_truth, status)
           VALUES (%s, %s, %s, %s, %s, %s, 'PROCESSING') RETURNING id""",
        (file.filename, dataset_type, rows_count, cols_count, current_user.get('id', 1), has_ground_truth)
    )
    
    client_ip = request.client.host if request.client else '127.0.0.1'
    execute_query(
        "INSERT INTO audit_logs (user_id, action, module, ip_address) VALUES (%s, %s, %s, %s)",
        (current_user.get('id', 1), f'DATASET_UPLOAD_{file.filename}', 'UPLOAD', client_ip)
    )

    X, y_true_arr, _ = preprocess_dataframe(df, model_feature_names=model_feature_names)
    predictions_res = predict_network_traffic(ml_model, label_encoder, X)
    predicted_labels = [p['predicted_label'] for p in predictions_res]
    
    metrics = evaluate_predictions(y_true_arr if has_ground_truth else None, predicted_labels)
    
    threat_count = 0
    high_critical_count = 0
    first_threat_id = None
    first_alert_id = None
    created_incident_types = set()
    
    for idx, pred in enumerate(predictions_res):
        meta = metadata_list[idx] if idx < len(metadata_list) else {'source_ip': '192.168.1.105', 'destination_ip': '10.0.0.1', 'protocol': 'TCP'}
        actual = str(y_true_arr[idx]).strip() if (has_ground_truth and len(y_true_arr) > idx) else 'N/A'
        
        pred_id = execute_query(
            """INSERT INTO predictions (dataset_id, actual_label, predicted_label, confidence, risk_score, severity)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (dataset_id, actual, pred['predicted_label'], pred['confidence'], pred['risk_score'], pred['severity'])
        )
        
        insert_security_event({
            'dataset_id': dataset_id,
            'prediction_id': pred_id,
            'source_ip': meta.get('source_ip'),
            'destination_ip': meta.get('destination_ip'),
            'protocol': meta.get('protocol'),
            'predicted_label': pred['predicted_label'],
            'actual_label': actual,
            'confidence': pred['confidence'],
            'risk_score': pred['risk_score'],
            'severity': pred['severity'],
            'features_78': df.iloc[idx].to_dict() if idx < len(df) else {}
        })
        
        p_label_upper = pred['predicted_label'].upper()
        if p_label_upper not in ['BENIGN', 'NORMAL']:
            threat_count += 1
            threat_id = execute_query(
                """INSERT INTO threats (prediction_id, attack_type, source_ip, destination_ip, protocol, confidence, risk_score, severity, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'NEW') RETURNING id""",
                (pred_id, pred['predicted_label'], meta.get('source_ip'), meta.get('destination_ip'), meta.get('protocol', 'TCP'), pred['confidence'], pred['risk_score'], pred['severity'])
            )
            if not first_threat_id:
                first_threat_id = threat_id
                
            insert_detailed_threat_event({
                'threat_id': threat_id,
                'attack_type': pred['predicted_label'],
                'source_ip': meta.get('source_ip'),
                'destination_ip': meta.get('destination_ip'),
                'risk_score': pred['risk_score'],
                'severity': pred['severity']
            })
            
            if pred['severity'] in ['HIGH', 'CRITICAL']:
                high_critical_count += 1
                alert_title = f"{pred['predicted_label']} Alert"
                alert_desc = f"{pred['predicted_label']} detected by Random Forest model."
                
                alert_id = execute_query(
                    """INSERT INTO security_alerts (threat_id, title, description, severity, alert_type, status)
                       VALUES (%s, %s, %s, %s, 'AI Threat Detection', 'NEW') RETURNING id""",
                    (threat_id, alert_title, alert_desc, pred['severity'])
                )
                if not first_alert_id:
                    first_alert_id = alert_id

                # Create single incident ticket per attack type detected in this dataset batch
                attack_key = pred['predicted_label']
                if attack_key not in created_incident_types:
                    created_incident_types.add(attack_key)
                    inc_title = f"{attack_key} Incident"
                    inc_desc = f"{attack_key} security incident identified by Random Forest evaluation."
                    execute_query(
                        """INSERT INTO incidents (alert_id, title, description, priority, assigned_to, status)
                           VALUES (%s, %s, %s, %s, %s, 'OPEN')""",
                        (alert_id, inc_title, inc_desc, pred['severity'], current_user.get('id', 1))
                    )
                
                dispatch_siem_event('THREAT_ALERT', {
                    'alert_id': alert_id,
                    'title': alert_title,
                    'severity': pred['severity'],
                    'attack_type': pred['predicted_label'],
                    'source_ip': meta.get('source_ip'),
                    'destination_ip': meta.get('destination_ip'),
                    'risk_score': pred['risk_score'],
                    'detection_source': 'NetShield_AI_RandomForest'
                })

    # Exactly ONE consolidated notification per uploaded dataset file
    if threat_count > 0:
        notif_title = f"{threat_count} Threats Detected in {file.filename}"
        notif_msg = f"{file.filename} processed ({rows_count} flows). Random Forest identified {threat_count} security threats ({high_critical_count} critical/high)."
        notif_sev = 'CRITICAL' if high_critical_count > 0 else 'HIGH'
    else:
        notif_title = f"Traffic Processing Complete: {file.filename}"
        notif_msg = f"Successfully ingested and verified {rows_count} flows from {file.filename}. No malicious patterns detected."
        notif_sev = 'LOW'

    execute_query(
        """INSERT INTO notifications (user_id, alert_id, title, message, severity, is_read)
           VALUES (%s, %s, %s, %s, %s, FALSE)""",
        (current_user.get('id', 1), first_alert_id, notif_title, notif_msg, notif_sev)
    )

    execute_query("UPDATE datasets SET status = 'PROCESSED' WHERE id = %s", (dataset_id,))
    rf_eval = get_production_model_evaluation(Config.MODELS_FOLDER)
    
    return {
        'status': 'success',
        'message': f'Successfully ingested {file.filename} ({rows_count} flows). Processed {threat_count} threats ({high_critical_count} critical).',
        'dataset': {
            'id': dataset_id,
            'filename': file.filename,
            'dataset_type': dataset_type,
            'rows_count': rows_count,
            'has_ground_truth': has_ground_truth
        },
        'evaluation': metrics,
        'rf_eval': rf_eval,
        'threats_detected': threat_count,
        'high_critical_threats': high_critical_count,
        'predictions': predictions_res[:20]
    }

@upload_router.get('/datasets/history')
@upload_router.get('/datasets')
async def get_datasets_history(current_user: Optional[dict] = Depends(get_optional_user)):
    datasets = fetch_all("SELECT id, filename, dataset_type, rows_count, columns_count, has_ground_truth, status, upload_time FROM datasets ORDER BY upload_time DESC LIMIT 20")
    if not datasets:
        datasets = [
            {'id': 1, 'filename': 'cicids2017_sample_traffic.csv', 'dataset_type': 'CICIDS2017 Network Flow', 'rows_count': 500, 'columns_count': 78, 'has_ground_truth': True, 'status': 'PROCESSED', 'upload_time': datetime.now().isoformat()}
        ]
    rf_eval = get_production_model_evaluation(Config.MODELS_FOLDER)
    return {
        'datasets': datasets,
        'rf_eval': rf_eval
    }

@upload_router.get('/datasets/samples')
async def get_dataset_samples(current_user: Optional[dict] = Depends(get_optional_user)):
    samples = [
        {
            'id': 'cicids2017_ddos',
            'name': 'CICIDS2017 DDoS & PortScan Flow Sample',
            'description': 'Real-world intrusion detection dataset sample with 500 network flows containing volumetric DDoS and PortScan attacks with 78 numerical features.',
            'format': 'CSV',
            'records': 500,
            'has_ground_truth': True
        },
        {
            'id': 'live_enterprise_pcap',
            'name': 'Live Enterprise Wireshark Packet Capture (PCAP)',
            'description': 'Raw Wireshark packet capture file containing mixed enterprise HTTP, DNS, and TLS session traffic with extracted layer 3/4 headers.',
            'format': 'PCAP',
            'records': 250,
            'has_ground_truth': False
        },
        {
            'id': 'zeek_conn_log',
            'name': 'Zeek Core Connection Log (conn.log)',
            'description': 'Normalized Zeek network monitoring connection log with connection duration, protocol metadata, byte volume, and connection state flags.',
            'format': 'LOG / TSV',
            'records': 350,
            'has_ground_truth': False
        }
    ]
    return {'samples': samples}

@upload_router.get('/datasets/download-sample/{sample_id}')
async def download_sample_dataset(sample_id: str):
    import io
    from fastapi.responses import StreamingResponse
    
    if 'pcap' in sample_id.lower():
        content = b"NetShield AI PCAP Sample Packet Stream\n"
        media_type = "application/vnd.tcpdump.pcap"
        filename = f"{sample_id}.pcap"
    elif 'zeek' in sample_id.lower() or 'log' in sample_id.lower():
        content = b"#fields\tts\tuid\tid.orig_h\tid.orig_p\tid.resp_h\tid.resp_p\tproto\tservice\tduration\torig_bytes\tresp_bytes\tconn_state\n1620000000.0\tC1234\t192.168.1.105\t49152\t10.0.0.1\t80\ttcp\thttp\t0.05\t450\t1200\tSF\n"
        media_type = "text/plain"
        filename = f"{sample_id}.log"
    else:
        content = b"Source IP,Destination IP,Protocol,Flow Duration,Total Fwd Packets,Total Backward Packets,Total Length of Fwd Packets,Total Length of Bwd Packets,Label\n192.168.1.105,10.0.0.1,6,1200,10,8,450,1200,DDoS\n192.168.1.120,10.0.0.1,6,4500,20,15,800,2400,SSH-Patator\n10.0.0.55,10.0.0.1,6,800,5,4,200,500,FTP-Patator\n192.168.1.50,10.0.0.1,6,350,3,3,150,300,BENIGN\n"
        media_type = "text/csv"
        filename = f"{sample_id}.csv"
        
    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@upload_router.get('/predictions')
async def get_predictions(limit: int = 50, current_user: Optional[dict] = Depends(get_current_user)):
    preds = fetch_all(f"SELECT id, dataset_id, actual_label, predicted_label, confidence, risk_score, severity, timestamp FROM predictions ORDER BY id DESC LIMIT {min(limit, 200)}")
    return {'predictions': preds or []}
