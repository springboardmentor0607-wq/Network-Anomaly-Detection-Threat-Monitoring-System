import json
import csv
from pathlib import Path
from backend.ai.config.config import REPORTS_DIR
from backend.ai.utils.logger import get_logger

logger = get_logger("ReportGenerator")

def generate_reports(metrics_bundle, dataset_name="CICIDS2017"):
    """
    Generates evaluation & threat reports in JSON, CSV, and PDF formats inside backend/ai/reports/.
    """
    base_name = f"evaluation_report_{dataset_name}"

    json_path = REPORTS_DIR / f"{base_name}.json"
    csv_path = REPORTS_DIR / f"{base_name}.csv"
    pdf_path = REPORTS_DIR / f"{base_name}.pdf"

    # 1. JSON Report
    with open(json_path, "w") as f:
        json.dump(metrics_bundle, f, indent=2)

    # 2. CSV Report
    comparison = metrics_bundle.get("comparison", [])
    if not comparison and isinstance(metrics_bundle, list):
        comparison = metrics_bundle

    fieldnames = ["modelName", "accuracy", "precision", "recall", "f1Score", "rocAuc", "trainingTimeMs", "inferenceTimeMs", "memoryUsageMb", "isRecommended"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for row in comparison:
            writer.writerow(row)

    # 3. PDF Report Generation
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#00c8ff'),
            spaceAfter=12
        )

        story.append(Paragraph("NetShield AI - Model Evaluation & Intrusion Prediction Report", title_style))
        story.append(Paragraph(f"Dataset: <b>{dataset_name}</b> | Recommended Model: <b>{metrics_bundle.get('recommendedModel', 'Random Forest')}</b>", styles['Normal']))
        story.append(Spacer(1, 12))

        table_data = [["Model Name", "Accuracy", "Precision", "Recall", "F1 Score", "Inference (ms)"]]
        for row in comparison:
            table_data.append([
                row.get("modelName", ""),
                f"{row.get('accuracy', 0):.4f}",
                f"{row.get('precision', 0):.4f}",
                f"{row.get('recall', 0):.4f}",
                f"{row.get('f1Score', 0):.4f}",
                f"{row.get('inferenceTimeMs', 0)} ms"
            ])

        t = Table(table_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#38bdf8')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#334155')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ]))
        story.append(t)
        doc.build(story)
        logger.info(f"Generated PDF report at {pdf_path}")

    except Exception:
        # Simple plain text fallback for PDF file
        with open(pdf_path, "w", encoding="utf-8") as f:
            f.write(f"NetShield AI Evaluation Report - {dataset_name}\n")
            f.write("="*60 + "\n")
            f.write(json.dumps(metrics_bundle, indent=2))
        logger.info(f"Generated plain PDF text export at {pdf_path}")

    return {
        "json": str(json_path),
        "csv": str(csv_path),
        "pdf": str(pdf_path)
    }
