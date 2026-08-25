import { useState, useEffect, useRef } from "react";
import API from "./api/api";
import "./Dashboard.css";
import ModelTesting from "./ModelTesting";
import Reports from "./Reports";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";

function AnalystDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("Dashboard");

const storedUser = JSON.parse(
  localStorage.getItem("user") || "{}"
);
  const [trafficData, setTrafficData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [trafficTrend, setTrafficTrend] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedTraffic, setSelectedTraffic] = useState(null);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [selectedDataset, setSelectedDataset] =
  useState("CICIDS2017");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [notifications, setNotifications] = useState([]);
const [unreadNotifications, setUnreadNotifications] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
const knownAlertIdsRef = useRef(new Set());
const initialAlertsLoadedRef = useRef(false);
const [securityReport, setSecurityReport] = useState(null);
const [securityReportLoading, setSecurityReportLoading] = useState(false);
const [securityAnalytics, setSecurityAnalytics] = useState(null);
const [analyticsLoading, setAnalyticsLoading] = useState(false);

const [incidentAssignee, setIncidentAssignee] = useState(
  storedUser.full_name || "Security Analyst"
);

  const [stats, setStats] = useState({
    total_packets: 0,
    normal_traffic: 0,
    attack_traffic: 0,
    anomalies_detected: 0,
    risk_score: 0,
    risk_level: "LOW"
  });

  const [protocolStats, setProtocolStats] = useState({
    HTTP: 0,
    HTTPS: 0,
    DNS: 0,
    OTHER: 0
  });

  const COLORS = [
    "#22c55e",
    "#ef4444",
    "#f59e0b",
    "#3b82f6"
  ];

  // ==============================
  // THREAT DATA
  // ==============================

  const threatData = [
    {
      name: "Normal",
      value: stats.normal_traffic || 0
    },
    {
      name: "Attack",
      value: stats.attack_traffic || 0
    }
  ];

  // ==============================
  // PROTOCOL DATA
  // ==============================

  const protocolData = [
    {
      name: "HTTP",
      value: protocolStats.HTTP
    },
    {
      name: "HTTPS",
      value: protocolStats.HTTPS
    },
    {
      name: "DNS",
      value: protocolStats.DNS
    },
    {
      name: "Other",
      value: protocolStats.OTHER
    }
  ];

// ==============================
// GET SECURITY ANALYTICS
// ==============================

const getSecurityAnalytics = async () => {

  try {

    setAnalyticsLoading(true);

    const response = await API.get(
      "/analytics/"
    );

    console.log(
      "✅ Security analytics:",
      response.data
    );

    setSecurityAnalytics(
      response.data
    );

  } catch (error) {

    console.error(
      "❌ Analytics API Error:",
      error.response?.data ||
      error.message
    );

  } finally {

    setAnalyticsLoading(false);

  }
};

// ==============================
// GET LIVE TRAFFIC
// ==============================

const getTraffic = async () => {
  try {

    // --------------------------------
    // GET SELECTED DATASET TRAFFIC
    // --------------------------------

    const response = await API.get(
      `/traffic?dataset=${encodeURIComponent(
        selectedDataset
      )}`
    );

    const data = response.data;

    console.log(
      "✅ Traffic received:",
      data
    );


    // --------------------------------
    // DEFAULT PREDICTION
    // --------------------------------

    let prediction = {
      prediction: "Unknown",
      confidence: "0%",
      attack_type: "None",
      severity: "LOW"
    };


    // =================================
    // CICIDS2017
    // =================================

    if (
      selectedDataset === "CICIDS2017"
    ) {

      try {

        const predictionResponse =
          await API.post(
            "/predict/cicids",
            {

              source_ip:
                data.source ||
                "Unknown",

              destination_ip:
                data.destination ||
                "Unknown",

              protocol:
                data.protocol ||
                "TCP",

              destination_port:
                Number(
                  data.destination_port ||
                  0
                ),

              duration:
                Number(
                  data.duration || 0
                ),

              src_packets:
                Number(
                  data.src_packets || 0
                ),

              dst_packets:
                Number(
                  data.dst_packets || 0
                ),

              src_bytes:
                Number(
                  data.src_bytes || 0
                ),

              dst_bytes:
                Number(
                  data.dst_bytes || 0
                ),

              flow_bytes_per_sec:
                Number(
                  data.flow_bytes_per_sec ||
                  0
                ),

              flow_packets_per_sec:
                Number(
                  data.flow_packets_per_sec ||
                  0
                )
            }
          );

        prediction =
          predictionResponse.data;

      } catch (predictionError) {

        console.error(
          "⚠️ CICIDS prediction failed:",
          predictionError.response?.data ||
          predictionError.message
        );

      }

    }


    // =================================
    // UNSW-NB15
    // =================================

    else if (
      selectedDataset === "UNSW-NB15"
    ) {

      try {

        const predictionResponse =
          await API.post(
            "/predict/unsw",
            {

              source_ip:
                data.source ||
                "Unknown",

              destination_ip:
                data.destination ||
                "Unknown",

              proto:
                String(
                  data.proto || ""
                ),

              service:
                String(
                  data.service || ""
                ),

              state:
                String(
                  data.state || ""
                ),

              dur:
                Number(
                  data.dur || 0
                ),

              spkts:
                Number(
                  data.spkts || 0
                ),

              dpkts:
                Number(
                  data.dpkts || 0
                ),

              sbytes:
                Number(
                  data.sbytes || 0
                ),

              dbytes:
                Number(
                  data.dbytes || 0
                ),

              rate:
                Number(
                  data.rate || 0
                ),

              sload:
                Number(
                  data.sload || 0
                ),

              dload:
                Number(
                  data.dload || 0
                ),

              sloss:
                Number(
                  data.sloss || 0
                ),

              dloss:
                Number(
                  data.dloss || 0
                ),

              sinpkt:
                Number(
                  data.sinpkt || 0
                ),

              dinpkt:
                Number(
                  data.dinpkt || 0
                ),

              sjit:
                Number(
                  data.sjit || 0
                ),

              djit:
                Number(
                  data.djit || 0
                ),

              swin:
                Number(
                  data.swin || 0
                ),

              stcpb:
                Number(
                  data.stcpb || 0
                ),

              dtcpb:
                Number(
                  data.dtcpb || 0
                ),

              dwin:
                Number(
                  data.dwin || 0
                ),

              tcprtt:
                Number(
                  data.tcprtt || 0
                ),

              synack:
                Number(
                  data.synack || 0
                ),

              ackdat:
                Number(
                  data.ackdat || 0
                ),

              smean:
                Number(
                  data.smean || 0
                ),

              dmean:
                Number(
                  data.dmean || 0
                ),

              trans_depth:
                Number(
                  data.trans_depth || 0
                ),

              response_body_len:
                Number(
                  data.response_body_len || 0
                ),

              ct_src_dport_ltm:
                Number(
                  data.ct_src_dport_ltm || 0
                ),

              ct_dst_sport_ltm:
                Number(
                  data.ct_dst_sport_ltm || 0
                ),

              is_ftp_login:
                Number(
                  data.is_ftp_login || 0
                ),

              ct_ftp_cmd:
                Number(
                  data.ct_ftp_cmd || 0
                ),

              ct_flw_http_mthd:
                Number(
                  data.ct_flw_http_mthd || 0
                ),

              is_sm_ips_ports:
                Number(
                  data.is_sm_ips_ports || 0
                )
            }
          );

        prediction =
          predictionResponse.data;

      } catch (predictionError) {

        console.error(
          "⚠️ UNSW prediction failed:",
          predictionError.response?.data ||
          predictionError.message
        );

      }

    }


    // =================================
    // CREATE UNIFIED TRAFFIC OBJECT
    // =================================

    const newTraffic = {

      id: Date.now(),

      dataset:
        selectedDataset,

      source:
        data.source ||
        "Unknown",

      destination:
        data.destination ||
        "Unknown",


      // -------------------------------
      // CICIDS FIELDS
      // -------------------------------

      protocol:
        data.protocol ||
        "Unknown",

      destination_port:
        Number(
          data.destination_port ||
          0
        ),

      duration:
        Number(
          data.duration ||
          0
        ),

      src_packets:
        Number(
          data.src_packets ||
          0
        ),

      dst_packets:
        Number(
          data.dst_packets ||
          0
        ),

      src_bytes:
        Number(
          data.src_bytes ||
          0
        ),

      dst_bytes:
        Number(
          data.dst_bytes ||
          0
        ),


      // -------------------------------
      // UNSW FIELDS
      // -------------------------------

      proto:
        data.proto ||
        "Unknown",

      service:
        data.service ||
        "Unknown",

      state:
        data.state ||
        "Unknown",

      spkts:
        Number(
          data.spkts ||
          0
        ),

      dpkts:
        Number(
          data.dpkts ||
          0
        ),

      sbytes:
        Number(
          data.sbytes ||
          0
        ),

      dbytes:
        Number(
          data.dbytes ||
          0
        ),


      // -------------------------------
      // AI RESULT
      // -------------------------------

      status:
        prediction.prediction ||
        "Unknown",

      confidence:
        prediction.confidence ||
        "0%",

      attack_type:
        prediction.attack_type ||
        "None",

      severity:
        prediction.severity ||
        "LOW"

    };


    console.log(
      "📊 Adding traffic:",
      newTraffic
    );


    // =================================
    // ADD TO LIVE TRAFFIC TABLE
    // =================================

    setTrafficData(
      (previous) => [
        ...previous.slice(-19),
        newTraffic
      ]
    );


    // =================================
    // TRAFFIC TREND
    // =================================

    setTrafficTrend(
      (previous) => [
        ...previous.slice(-9),
        {
          time:
            new Date().toLocaleTimeString(),

          value: 1
        }
      ]
    );


    // =================================
    // LIVE DASHBOARD STATS
    // =================================

    setStats((previous) => {

      const isAttack =
        prediction.prediction ===
        "Attack";

      return {

        ...previous,

        total_packets:
          previous.total_packets + 1,

        normal_traffic:
          previous.normal_traffic +
          (
            isAttack
              ? 0
              : 1
          ),

        attack_traffic:
          previous.attack_traffic +
          (
            isAttack
              ? 1
              : 0
          ),

        anomalies_detected:
          previous.anomalies_detected +
          (
            isAttack
              ? 1
              : 0
          ),

        risk_score:
          isAttack
            ? Math.min(
                100,
                previous.risk_score +
                10
              )
            : previous.risk_score,

        risk_level:
          isAttack
            ? "HIGH"
            : previous.risk_level ||
              "LOW"
      };

    });


  } catch (error) {

    console.error(
      "❌ Traffic API Error:",
      error.response?.data ||
      error.message
    );

  }
};

  // ==============================
  // GET DASHBOARD STATS
  // ==============================

  const getDashboardStats = async () => {
    try {
      const response =
        await API.get("/dashboard/stats");

      console.log(
        "Dashboard stats:",
        response.data
      );

      setStats(response.data);

    } catch (error) {
      console.error(
        "Dashboard stats error:",
        error
      );
    }
  };

  // ==============================
// GET MODEL PERFORMANCE REPORT
// ==============================

const getReportData = async () => {
  try {
    setReportLoading(true);

    const response = await API.get(
      "/reports/model-performance"
    );

    console.log(
      "Report data:",
      response.data
    );

    setReportData(response.data);

  } catch (error) {
    console.error(
      "Report API Error:",
      error
    );
  } finally {
    setReportLoading(false);
  }
};

  // ==============================
// MANUAL ANALYZE TRAFFIC
// ==============================

const analyzeTraffic = async (index) => {

  const item = trafficData[index];

  if (!item) {
    return;
  }

  try {

    setSelectedTraffic({
      ...item,
      analyzing: true
    });

    let result;


    // ==========================================
    // CICIDS2017 ANALYSIS
    // ==========================================

    if (selectedDataset === "CICIDS2017") {

      const response = await API.post(
        "/predict/cicids",
        {
          source_ip:
            item.source || "Unknown",

          destination_ip:
            item.destination || "Unknown",

          protocol:
            item.protocol || "TCP",

          destination_port:
            Number(
              item.destination_port || 0
            ),

          duration:
            Number(
              item.duration || 0
            ),

          src_packets:
            Number(
              item.src_packets || 0
            ),

          dst_packets:
            Number(
              item.dst_packets || 0
            ),

          src_bytes:
            Number(
              item.src_bytes || 0
            ),

          dst_bytes:
            Number(
              item.dst_bytes || 0
            ),

          flow_bytes_per_sec:
            Number(
              item.flow_bytes_per_sec || 0
            ),

          flow_packets_per_sec:
            Number(
              item.flow_packets_per_sec || 0
            )
        }
      );

      result = response.data;

    }


    // ==========================================
    // UNSW-NB15 ANALYSIS
    // ==========================================

    else if (selectedDataset === "UNSW-NB15") {

      const response = await API.post(
        "/predict/unsw",
        {
          source_ip:
            item.source || "Unknown",

          destination_ip:
            item.destination || "Unknown",

          proto:
            String(
              item.proto || ""
            ),

          service:
            String(
              item.service || ""
            ),

          state:
            String(
              item.state || ""
            ),

          dur:
            Number(
              item.dur || 0
            ),

          spkts:
            Number(
              item.spkts || 0
            ),

          dpkts:
            Number(
              item.dpkts || 0
            ),

          sbytes:
            Number(
              item.sbytes || 0
            ),

          dbytes:
            Number(
              item.dbytes || 0
            ),

          rate:
            Number(
              item.rate || 0
            ),

          sload:
            Number(
              item.sload || 0
            ),

          dload:
            Number(
              item.dload || 0
            ),

          sloss:
            Number(
              item.sloss || 0
            ),

          dloss:
            Number(
              item.dloss || 0
            ),

          sinpkt:
            Number(
              item.sinpkt || 0
            ),

          dinpkt:
            Number(
              item.dinpkt || 0
            ),

          sjit:
            Number(
              item.sjit || 0
            ),

          djit:
            Number(
              item.djit || 0
            ),

          swin:
            Number(
              item.swin || 0
            ),

          stcpb:
            Number(
              item.stcpb || 0
            ),

          dtcpb:
            Number(
              item.dtcpb || 0
            ),

          dwin:
            Number(
              item.dwin || 0
            ),

          tcprtt:
            Number(
              item.tcprtt || 0
            ),

          synack:
            Number(
              item.synack || 0
            ),

          ackdat:
            Number(
              item.ackdat || 0
            ),

          smean:
            Number(
              item.smean || 0
            ),

          dmean:
            Number(
              item.dmean || 0
            ),

          trans_depth:
            Number(
              item.trans_depth || 0
            ),

          response_body_len:
            Number(
              item.response_body_len || 0
            ),

          ct_src_dport_ltm:
            Number(
              item.ct_src_dport_ltm || 0
            ),

          ct_dst_sport_ltm:
            Number(
              item.ct_dst_sport_ltm || 0
            ),

          is_ftp_login:
            Number(
              item.is_ftp_login || 0
            ),

          ct_ftp_cmd:
            Number(
              item.ct_ftp_cmd || 0
            ),

          ct_flw_http_mthd:
            Number(
              item.ct_flw_http_mthd || 0
            ),

          is_sm_ips_ports:
            Number(
              item.is_sm_ips_ports || 0
            )
        }
      );

      result = response.data;

    }


    // ==========================================
    // UPDATE TRAFFIC ROW
    // ==========================================

    setTrafficData((prev) =>
      prev.map((traffic, i) =>
        i === index
          ? {
              ...traffic,

              status:
                result.prediction ||
                traffic.status,

              confidence:
                result.confidence ||
                traffic.confidence,

              attack_type:
                result.attack_type ||
                "None",

              severity:
                result.severity ||
                "LOW"
            }
          : traffic
      )
    );


    // ==========================================
    // INVESTIGATION RESULT
    // ==========================================

    setSelectedTraffic({

      ...item,

      prediction:
        result.prediction,

      confidence:
        result.confidence ||
        item.confidence,

      attack_type:
        result.attack_type ||
        "None",

      severity:
        result.severity ||
        "LOW",

      risk_score:
        result.risk_score ?? 0,

      risk_level:
        result.risk_level ||
        "LOW",

      alert_id:
        result.alert_id ||
        null,

      analyzing: false

    });

  } catch (error) {

    console.error(
      "Investigation error:",
      error.response?.data ||
      error.message
    );

    setSelectedTraffic({

      ...item,

      error:
        error.response?.data?.detail ||
        "Unable to analyze traffic.",

      analyzing: false

    });

  }
};

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    navigate("/login");
  };

  // ==============================
// DOWNLOAD PDF REPORT
// ==============================

const downloadReport = () => {
  if (!reportData) {
    return;
  }

  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(22);
  doc.text("NetShield AI", 20, y);

  y += 10;

  doc.setFontSize(16);
  doc.text(
    "SOC Analyst Model Performance Report",
    20,
    y
  );

  y += 15;

  doc.setFontSize(11);

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    20,
    y
  );

  y += 15;

  doc.setFontSize(15);
  doc.text("Intrusion Detection", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    `Model: ${reportData.intrusion_detection.model}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Accuracy: ${reportData.intrusion_detection.accuracy}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Status: ${reportData.intrusion_detection.status}`,
    20,
    y
  );

  y += 12;

  doc.setFontSize(15);
  doc.text("Threat Classification", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    `Model: ${reportData.threat_classification.model}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Accuracy: ${reportData.threat_classification.accuracy}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Precision: ${reportData.threat_classification.precision}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Recall: ${reportData.threat_classification.recall}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `F1 Score: ${reportData.threat_classification.f1_score}%`,
    20,
    y
  );

  y += 12;

  doc.setFontSize(15);
  doc.text("Anomaly Detection", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    `Model: ${reportData.anomaly_detection.model}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Anomalies Detected: ${reportData.anomaly_detection.anomalies_detected}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Anomaly Percentage: ${reportData.anomaly_detection.anomaly_percentage}%`,
    20,
    y
  );

  y += 12;

  doc.setFontSize(15);
  doc.text("System Status", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    reportData.overall_status,
    20,
    y
  );

  doc.save(
    "NetShield_AI_Model_Performance_Report.pdf"
  );
};


// ==============================
// GET SECURITY ALERTS + NOTIFY
// ==============================

const getAlerts = async () => {

  try {

    const response = await API.get("/alerts/");

    const databaseAlerts =
      response.data || [];

    setAlerts(databaseAlerts);


    // ==========================================
    // FIRST LOAD
    // ==========================================

    if (!initialAlertsLoadedRef.current) {

      databaseAlerts.forEach((alert) => {
        knownAlertIdsRef.current.add(
          alert.id
        );
      });

      initialAlertsLoadedRef.current = true;

      return;
    }


    // ==========================================
    // FIND ONLY NEW ALERTS
    // ==========================================

    const newAlerts =
      databaseAlerts.filter(
        (alert) =>
          !knownAlertIdsRef.current.has(
            alert.id
          )
      );


    if (newAlerts.length === 0) {
      return;
    }


    // ==========================================
    // REMEMBER NEW ALERTS
    // ==========================================

    newAlerts.forEach((alert) => {

      knownAlertIdsRef.current.add(
        alert.id
      );

    });


    // ==========================================
    // CREATE NOTIFICATIONS
    // ==========================================

    const newNotifications =
      newAlerts.map((alert) => ({

        id:
          `NOTIF-${alert.id}-${Date.now()}`,

        alertId:
          alert.id,

        title:
          `${alert.severity} Security Alert`,

        message:
          `${alert.dataset} detected ${alert.attack_type}`,

        dataset:
          alert.dataset,

        attackType:
          alert.attack_type,

        severity:
          alert.severity,

        riskScore:
          alert.risk_score,

        detectedAt:
          alert.detected_at

      }));


    setNotifications((previous) => [

      ...newNotifications,

      ...previous

    ].slice(0, 20));


    setUnreadNotifications((previous) =>
      previous + newNotifications.length
    );


    // ==========================================
    // BROWSER NOTIFICATION
    // ==========================================

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {

      newNotifications.forEach(
        (notification) => {

          new Notification(
            notification.title,
            {
              body:
                `${notification.dataset} — ` +
                `${notification.attackType} — ` +
                `Risk ${notification.riskScore}`,

              icon: "/favicon.ico"
            }
          );

        }
      );

    }

  } catch (error) {

    console.error(
      "❌ Alert API Error:",
      error.response?.data ||
      error.message
    );

  }

};

// ==============================
// GET INCIDENTS FROM DATABASE
// ==============================

const getIncidents = async () => {
  try {
    const response = await API.get("/incidents/");

    console.log("✅ PostgreSQL incidents:", response.data);

    setIncidents(response.data);

  } catch (error) {
    console.error(
      "❌ Incident API Error:",
      error.response?.data || error.message
    );
  }
};

// ==============================
// CREATE INCIDENT FROM ALERT
// ==============================

const createIncident = async (securityAlert) => {

  try {

    const response = await API.post(
      "/incidents/",
      {
        alert_id:
          securityAlert.id,

        dataset:
          securityAlert.dataset ||
          "Unknown",

        attack_type:
          securityAlert.attack_type ||
          "Unknown",

        severity:
          securityAlert.severity ||
          "Low",

        source:
          securityAlert.source ||
          "Unknown",

        risk_score:
          Number(
            securityAlert.risk_score || 0
          ),

        assigned_to:
          storedUser.full_name ||
          "Security Analyst"
      }
    );

    console.log(
      "✅ Incident created:",
      response.data
    );

    await getIncidents();

    window.alert(
      "✅ Incident created successfully."
    );

  } catch (error) {

    console.error(
      "❌ Incident creation error:",
      error.response?.data ||
      error.message
    );

    window.alert(
      error.response?.data?.detail ||
      "Unable to create incident."
    );
  }
};

// ==============================
// UPDATE INCIDENT
// ==============================

const updateIncident = async (
  incident,
  status,
  assignedTo
) => {

  try {

    await API.put(
      `/incidents/${incident.incident_id}/status`,
      {
        status,
        assigned_to:
          assignedTo ||
          incident.assigned_to ||
          storedUser.full_name ||
          "Security Analyst"
      }
    );

    await getIncidents();

    // Refresh selected incident details
    setSelectedIncident((prev) => {

      if (!prev) {
        return null;
      }

      return {
        ...prev,
        status,
        assigned_to:
          assignedTo ||
          incident.assigned_to ||
          storedUser.full_name ||
          "Security Analyst",
        resolved_at:
          status === "Resolved"
            ? new Date().toISOString()
            : null
      };

    });

  } catch (error) {

    console.error(
      "❌ Incident update error:",
      error.response?.data ||
      error.message
    );

    window.alert(
      error.response?.data?.detail ||
      "Unable to update incident."
    );
  }
};

// ==============================
// GET SECURITY REPORT
// ==============================

const getSecurityReport = async () => {
  try {

    setSecurityReportLoading(true);

    const response = await API.get(
      "/security-reports/"
    );

    console.log(
      "✅ Security report:",
      response.data
    );

    setSecurityReport(
      response.data
    );

  } catch (error) {

    console.error(
      "❌ Security report error:",
      error.response?.data ||
      error.message
    );

  } finally {

    setSecurityReportLoading(false);

  }
};

  // ==============================
  // INITIAL LOAD + AUTO REFRESH
  // ==============================

 useEffect(() => {

  getTraffic();
  getDashboardStats();
  getReportData();
  getSecurityReport();
  getSecurityAnalytics();

  // Milestone 3 database data
  getAlerts();
  getIncidents();

  const timer = setInterval(() => {

    getTraffic();
    getDashboardStats();

    // Refresh database-backed security data
    getAlerts();
    getIncidents();

  }, 10000);

  return () => clearInterval(timer);

  setTrafficData([]);

  setSelectedTraffic(null);

}, [selectedDataset]);


// ==============================
// MILESTONE 3 STATISTICS
// ==============================

const totalAlerts = alerts.length;

const criticalAlerts = alerts.filter(
  (alert) =>
    String(alert.severity).toLowerCase() === "critical"
).length;

const highAlerts = alerts.filter(
  (alert) =>
    String(alert.severity).toLowerCase() === "high"
).length;

const openIncidents = incidents.filter(
  (incident) =>
    incident.status === "Open"
).length;

// ==============================
// INCIDENT STATISTICS
// ==============================

const openIncidentCount = incidents.filter(
  (incident) =>
    incident.status === "Open"
).length;

const inProgressIncidentCount = incidents.filter(
  (incident) =>
    incident.status === "In Progress"
).length;

const resolvedIncidentCount = incidents.filter(
  (incident) =>
    incident.status === "Resolved"
).length;

// ==============================
// ENABLE BROWSER NOTIFICATIONS
// ==============================

const enableNotifications = async () => {

  if (!("Notification" in window)) {

    window.alert(
      "Browser notifications are not supported."
    );

    return;
  }

  try {

    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {

      window.alert(
        "✅ Security notifications enabled."
      );

    } else {

      window.alert(
        "Notifications were not enabled."
      );

    }

  } catch (error) {

    console.error(
      "Notification permission error:",
      error
    );

  }
};

  // ==============================
  // RETURN UI
  // ==============================

  return (
    <div className="dashboard">

      {/* ==============================
          SIDEBAR
      ============================== */}

      <aside className="sidebar">

        <div className="logo">

          <span className="logo-icon">
            ⛊
          </span>

          <span className="logo-text">
            NetShield AI
          </span>

        </div>

        <ul>

          <li
            className={
              activePage === "Dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Dashboard")
            }
          >
            📊 Dashboard
          </li>

          <li
            className={
              activePage === "Network"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Network")
            }
          >
            🌐 Network Monitoring
          </li>

          <li
            className={
              activePage === "Alerts"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Alerts")
            }
          >
            🚨 Threat Alerts
          </li>

          <li
            className={
              activePage === "Incidents"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Incidents")
            }
          >
            🛡️ Incident Management
          </li>

          <li 
          className={ 
            activePage === "Reports" 
            ? "active" : 
            "" } onClick={() => setActivePage("Reports") 
            } 
            > 
            📄 Reports </li>

          <li
            className={
              activePage === "Analytics"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Analytics")
            }
          >
            📈 Analytics
          </li>

          <li
            className={
              activePage === "ModelTesting"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("ModelTesting")
            }
          >
            🧪 Model Testing
          </li>

          <li
            className={
              activePage === "Profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Profile")
            }
          >
            👤 Profile
          </li>

          <li onClick={handleLogout}>
            🚪 Logout
          </li>

        </ul>

      </aside>

      {/* ==============================
          MAIN CONTENT
      ============================== */}

      <main className="main">

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
      marginBottom: "25px",
      flexWrap: "wrap"
    }}
  >

    <h1 style={{ marginBottom: 0 }}>
      SOC Analyst Dashboard
    </h1>


    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}
    >

      <button
        onClick={enableNotifications}
      >
        🔔 Enable Notifications
      </button>


      <button
  onClick={() => {
    setShowNotifications(
      (previous) => !previous
    );

    setUnreadNotifications(0);
  }}
  style={{
    position: "relative"
  }}
>
  🔔

  {unreadNotifications > 0 && (
    <span
      style={{
        position: "absolute",
        top: "-8px",
        right: "-8px",
        minWidth: "22px",
        height: "22px",
        padding: "0 5px",
        borderRadius: "50%",
        background: "#ef4444",
        color: "white",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold"
      }}
    >
      {unreadNotifications}
    </span>
  )}
</button>

    </div>

  </div>

  {/* ==============================
    NOTIFICATION PANEL
============================== */}

{showNotifications && (

  <div
    className="result-box"
    style={{
      marginTop: "0",
      marginBottom: "25px"
    }}
  >

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px"
      }}
    >

      <h2>
        🔔 Security Notifications
      </h2>


      <button
        onClick={() =>
          setNotifications([])
        }
      >
        Clear
      </button>

    </div>


    {notifications.length === 0 ? (

      <p>
        No new notifications.
      </p>

    ) : (

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >

        {notifications.map(
          (notification) => (

            <div
              key={notification.id}
              className="notification-item"
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                  alignItems: "center"
                }}
              >

                <strong>
                  🚨 {notification.title}
                </strong>

                <span
                  className={`severity-badge ${
                    String(
                      notification.severity
                    ).toLowerCase() ===
                    "critical"
                      ? "severity-critical"
                      : String(
                          notification.severity
                        ).toLowerCase() ===
                        "high"
                      ? "severity-high"
                      : String(
                          notification.severity
                        ).toLowerCase() ===
                        "medium"
                      ? "severity-medium"
                      : "severity-low"
                  }`}
                >
                  {notification.severity}
                </span>

              </div>


              <p>
                {notification.message}
              </p>


              <p>
                <strong>
                  Risk:
                </strong>{" "}
                {notification.riskScore}
              </p>


              <p>
                <strong>
                  Detected:
                </strong>{" "}
                {notification.detectedAt
                  ? new Date(
                      notification.detectedAt
                    ).toLocaleString()
                  : "Unknown"}
              </p>

            </div>

          )
        )}

      </div>

    )}

  </div>

)}

        {/* ==============================
            DASHBOARD
        ============================== */}

        {activePage === "Dashboard" && (
          <>

          <div className="result-box">

  <h2>🗂️ Monitoring Dataset</h2>

  <select
    value={selectedDataset}
    onChange={(e) =>
      setSelectedDataset(e.target.value)
    }
    style={{
      padding: "12px",
      borderRadius: "10px",
      background: "#0f172a",
      color: "white",
      border: "1px solid #14b8a6",
      minWidth: "220px"
    }}
  >
    <option value="CICIDS2017">
      CICIDS2017
    </option>

    <option value="UNSW-NB15">
      UNSW-NB15
    </option>
  </select>

</div>

            {/* STAT CARDS */}

            <div className="cards">

              <div className="card">
                <h2>{stats.total_packets || 0}</h2>
                <p>Traffic Flows</p>
              </div>

              <div className="card">
                <h2>{stats.attack_traffic || 0}</h2>
                <p>Threats Detected</p>
              </div>

              <div className="card">
                <h2>{stats.normal_traffic || 0}</h2>
                <p>Normal Traffic</p>
              </div>

              <div className="card">
                <h2>{stats.anomalies_detected || 0}</h2>
                <p>Anomalies Detected</p>
              </div>

            </div>

            {/* MILESTONE 3 SECURITY CARDS */}

            <div className="cards">

              <div className="card">
                <h2>{totalAlerts}</h2>
                <p>Security Alerts</p>
              </div>

              <div className="card">
                <h2>{criticalAlerts}</h2>
                <p>Critical Alerts</p>
              </div>

              <div className="card">
                <h2>{highAlerts}</h2>
                <p>High Severity Alerts</p>
              </div>

              <div className="card">
                <h2>{openIncidents}</h2>
                <p>Open Incidents</p>
              </div>

            </div>

            {/* RISK SCORE */}

            <div className="result-box">

              <h2>🛡️ Risk Assessment</h2>

              <p>
                Risk Score:
                <b> {stats.risk_score || 0}/100</b>
              </p>

              <p>
                Risk Level:
                <b> {stats.risk_level || "LOW"}</b>
              </p>

            </div>

            {/* THREAT CHART */}

            <div className="chart-card">

              <h2>Threat Analytics</h2>

              <ResponsiveContainer width="100%" height={300}>

                <PieChart>

                  <Pie
                    data={threatData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >

                    {threatData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />
                    ))}

                  </Pie>

                  <Tooltip />
                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </>
        )}

        {/* ==============================
            NETWORK MONITORING
        ============================== */}

        {activePage === "Network" && (
          <div className="result-box">

            <h2>
              🌐 Live Network Monitoring
            </h2>

            {trafficData.length === 0 ? (
              <p>
                ⏳ Waiting for network
                traffic...
              </p>
            ) : (

              <div
                style={{
                  overflowX: "auto"
                }}
              >

                <table>

  <thead>

    <tr>

      <th>
        Source IP
      </th>

      <th>
        Destination IP
      </th>


      {selectedDataset === "CICIDS2017" ? (

        <>
          <th>
            Protocol
          </th>

          <th>
            Src Packets
          </th>

          <th>
            Dst Packets
          </th>

          <th>
            Src Bytes
          </th>

          <th>
            Dst Bytes
          </th>
        </>

      ) : (

        <>
          <th>
            Protocol
          </th>

          <th>
            Service
          </th>

          <th>
            State
          </th>

          <th>
            Src Packets
          </th>

          <th>
            Dst Packets
          </th>

          <th>
            Src Bytes
          </th>

          <th>
            Dst Bytes
          </th>
        </>

      )}


      <th>
        Status
      </th>

      <th>
        Confidence
      </th>

      <th>
        Action
      </th>

    </tr>

  </thead>


  <tbody>

    {trafficData
      .slice()
      .reverse()
      .map(
        (item, index) => {

          const realIndex =
            trafficData.length -
            1 -
            index;


          return (

            <tr
              key={item.id}
            >

              {/* SOURCE */}

              <td>
                {item.source}
              </td>


              {/* DESTINATION */}

              <td>
                {item.destination}
              </td>


              {/* =================================
                  CICIDS2017
              ================================= */}

              {selectedDataset ===
                "CICIDS2017" ? (

                <>

                  <td>
                    {item.protocol}
                  </td>

                  <td>
                    {item.src_packets}
                  </td>

                  <td>
                    {item.dst_packets}
                  </td>

                  <td>
                    {item.src_bytes}
                  </td>

                  <td>
                    {item.dst_bytes}
                  </td>

                </>

              ) : (

                /* =================================
                   UNSW-NB15
                ================================= */

                <>

                  <td>
                    {item.proto}
                  </td>

                  <td>
                    {item.service}
                  </td>

                  <td>
                    {item.state}
                  </td>

                  <td>
                    {item.spkts}
                  </td>

                  <td>
                    {item.dpkts}
                  </td>

                  <td>
                    {item.sbytes}
                  </td>

                  <td>
                    {item.dbytes}
                  </td>

                </>

              )}


              {/* STATUS */}

              <td>

                <span
                  className={
                    item.status ===
                    "Attack"
                      ? "status attack"
                      : item.status ===
                        "Normal"
                      ? "status normal"
                      : "status waiting"
                  }
                >

                  {item.status ===
                  "Attack"
                    ? "🔴 ATTACK"
                    : item.status ===
                      "Normal"
                    ? "🟢 NORMAL"
                    : "⏳ WAITING"}

                </span>

              </td>


              {/* CONFIDENCE */}

              <td>
                {item.confidence}
              </td>


              {/* ACTION */}

              <td>

                <button
                  onClick={() =>
                    analyzeTraffic(
                      realIndex
                    )
                  }
                >
                  Analyze
                </button>

              </td>

            </tr>

          );

        }
      )}

  </tbody>

</table>

              </div>

            )}

          </div>
        )}

        {/* ==============================
    TRAFFIC INVESTIGATION
============================== */}

{selectedTraffic && (
  <div className="result-box">

    <h2>🔎 Traffic Investigation</h2>

    {selectedTraffic.analyzing ? (
      <p>🔄 Analyzing traffic with AI...</p>
    ) : selectedTraffic.error ? (
      <p>❌ {selectedTraffic.error}</p>
    ) : (
      <>

        <h3>🌐 Network Information</h3>

        <p>
          <strong>Source IP:</strong>{" "}
          {selectedTraffic.source || "Unknown"}
        </p>

        <p>
          <strong>Destination IP:</strong>{" "}
          {selectedTraffic.destination || "Unknown"}
        </p>

        <p>
          <strong>Protocol:</strong>{" "}
          {selectedTraffic.protocol}
        </p>

        <h3>📊 Traffic Features</h3>

        <p>
          <strong>Source Packets:</strong>{" "}
          {selectedTraffic.src_packets}
        </p>

        <p>
          <strong>Destination Packets:</strong>{" "}
          {selectedTraffic.dst_packets}
        </p>

        <p>
          <strong>Source Bytes:</strong>{" "}
          {selectedTraffic.src_bytes}
        </p>

        <p>
          <strong>Destination Bytes:</strong>{" "}
          {selectedTraffic.dst_bytes}
        </p>

        <h3>🤖 AI Analysis</h3>

        <p>
          <strong>Prediction:</strong>{" "}
          {selectedTraffic.prediction === "Attack"
            ? "🔴 ATTACK"
            : "🟢 NORMAL"}
        </p>

        <p>
          <strong>Confidence:</strong>{" "}
          {selectedTraffic.confidence}
        </p>

        <p>
          <strong>Attack Type:</strong>{" "}
          {selectedTraffic.attack_type}
        </p>

        <p>
          <strong>Severity:</strong>{" "}
          {selectedTraffic.severity}
        </p>

        <h3>🛡️ Recommended Action</h3>

        <p>
          {selectedTraffic.prediction === "Attack"
            ? "⚠️ Investigate the source IP and consider blocking or isolating the suspicious traffic."
            : "✅ No immediate action required. Continue monitoring the traffic."}
        </p>

        <div className="response-actions">

  {selectedTraffic.prediction === "Attack" && (
    <>
      <button
  onClick={() => {
    const ip = selectedTraffic.source;

    if (!ip) return;

    setBlockedIPs((prev) => {
      if (prev.includes(ip)) {
        return prev;
      }

      return [...prev, ip];
    });

    alert(`🛑 Source IP ${ip} has been blocked.`);
  }}
>
  🛑 Block Source IP
</button>

     <button
  onClick={() => {
    setAlerts((prev) =>
      prev.filter(
        (alert) =>
          alert.source !== selectedTraffic.source
      )
    );

    setSelectedTraffic(null);

    alert("✅ Alert marked as resolved.");
  }}
>
  ✅ Mark as Resolved
</button>
    </>
  )}

  <button
  onClick={() => {
    setSelectedTraffic(null);
  }}
>
  🔄 Keep Monitoring
</button>

</div>

        <button
          onClick={() => setSelectedTraffic(null)}
        >
          Close Investigation
        </button>

      </>
    )}

  </div>
)}

       {/* ==============================
    THREAT ALERTS
============================== */}

{activePage === "Alerts" && (
  <div className="result-box">

    <h2>🚨 Security Alerts</h2>

    {alerts.length === 0 ? (

      <p>No security alerts available.</p>

    ) : (

      <div style={{ overflowX: "auto" }}>

        <table>

          <thead>

            <tr>

              <th>Alert ID</th>

              <th>Dataset</th>

              <th>Attack Type</th>

              <th>Severity</th>

              <th>Source</th>

              <th>Risk</th>

              <th>Status</th>

              <th>Detected At</th>

              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            {alerts.map((alert) => (

              <tr key={alert.id}>

                {/* ALERT ID */}

                <td>
                  ALT-{alert.id}
                </td>


                {/* DATASET */}

                <td>

                  <span
                    className={
                      alert.dataset === "CICIDS2017"
                        ? "dataset-badge dataset-cicids"
                        : alert.dataset === "UNSW-NB15"
                        ? "dataset-badge dataset-unsw"
                        : "dataset-badge dataset-combined"
                    }
                  >

                    {alert.dataset}

                  </span>

                </td>


                {/* ATTACK TYPE */}

                <td>
                  {alert.attack_type || "Unknown"}
                </td>


                {/* SEVERITY */}

                <td>

                  <span
                    className={`severity-badge ${
                      String(alert.severity)
                        .toLowerCase() === "critical"
                        ? "severity-critical"
                        : String(alert.severity)
                            .toLowerCase() === "high"
                        ? "severity-high"
                        : String(alert.severity)
                            .toLowerCase() === "medium"
                        ? "severity-medium"
                        : "severity-low"
                    }`}
                  >

                    {alert.severity}

                  </span>

                </td>


                {/* SOURCE */}

                <td>
                  {alert.source || "Unknown"}
                </td>


                {/* RISK */}

                <td>

                  <span className="risk-score">
                    {alert.risk_score ?? 0}
                  </span>

                </td>


                {/* STATUS */}

                <td>

                  <span
                    className={`incident-status ${
                      String(alert.status)
                        .toLowerCase() === "open"
                        ? "incident-open"
                        : String(alert.status)
                            .toLowerCase() === "in progress"
                        ? "incident-progress"
                        : "incident-resolved"
                    }`}
                  >

                    {alert.status}

                  </span>

                </td>


                {/* DETECTED AT */}

                <td>

                  {alert.detected_at
                    ? new Date(
                        alert.detected_at
                      ).toLocaleString()
                    : "Unknown"}

                </td>


                {/* INCIDENT ACTION */}

                <td>

                  <button
                    onClick={() =>
                      createIncident(alert)
                    }
                  >
                    🛡️ Create Incident
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    )}

  </div>
)}

{/* ==============================
    INCIDENT MANAGEMENT
============================== */}

{activePage === "Incidents" && (
  <div className="incident-management">

    <h2>
      🛡️ Incident Management
    </h2>

    <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
      Investigate, assign and resolve security incidents generated
      from detected threats.
    </p>


    {/* ==========================================
        INCIDENT SUMMARY CARDS
    ========================================== */}

    <div className="cards">

      <div className="card">
        <h2>
          {openIncidentCount}
        </h2>

        <p>
          Open Incidents
        </p>
      </div>


      <div className="card">
        <h2>
          {inProgressIncidentCount}
        </h2>

        <p>
          In Progress
        </p>
      </div>


      <div className="card">
        <h2>
          {resolvedIncidentCount}
        </h2>

        <p>
          Resolved
        </p>
      </div>


      <div className="card">
        <h2>
          {incidents.length}
        </h2>

        <p>
          Total Incidents
        </p>
      </div>

    </div>


    {/* ==========================================
        INCIDENT TABLE
    ========================================== */}

    <div className="result-box">

      <h2>
        📋 Incident Queue
      </h2>

      {incidents.length === 0 ? (

        <p>
          No incidents available.
        </p>

      ) : (

        <div
          style={{
            overflowX: "auto"
          }}
        >

          <table>

            <thead>

              <tr>

                <th>
                  Incident ID
                </th>

                <th>
                  Alert ID
                </th>

                <th>
                  Dataset
                </th>

                <th>
                  Attack Type
                </th>

                <th>
                  Severity
                </th>

                <th>
                  Risk
                </th>

                <th>
                  Assigned To
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created At
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {incidents.map(
                (incident) => (

                  <tr
                    key={incident.id}
                  >

                    <td>
                      {incident.incident_id}
                    </td>

                    <td>
                      ALT-{incident.alert_id}
                    </td>

                    <td>
                      {incident.dataset}
                    </td>

                    <td>
                      {incident.attack_type}
                    </td>

                    <td>

                      <span
                        className={`severity-badge ${
                          String(
                            incident.severity
                          ).toLowerCase() ===
                          "critical"
                            ? "severity-critical"
                            : String(
                                incident.severity
                              ).toLowerCase() ===
                              "high"
                            ? "severity-high"
                            : String(
                                incident.severity
                              ).toLowerCase() ===
                              "medium"
                            ? "severity-medium"
                            : "severity-low"
                        }`}
                      >

                        {incident.severity}

                      </span>

                    </td>

                    <td>

                      <span className="risk-score">
                        {incident.risk_score}
                      </span>

                    </td>

                    <td>
                      {incident.assigned_to ||
                        "Unassigned"}
                    </td>

                    <td>

                      <span
                        className={`incident-status ${
                          incident.status ===
                          "Open"
                            ? "incident-open"
                            : incident.status ===
                              "In Progress"
                            ? "incident-progress"
                            : "incident-resolved"
                        }`}
                      >

                        {incident.status}

                      </span>

                    </td>

                    <td>

                      {incident.created_at
                        ? new Date(
                            incident.created_at
                          ).toLocaleString()
                        : "Unknown"}

                    </td>

                    <td>

                      <button
                        onClick={() => {

                          setSelectedIncident(
                            incident
                          );

                          setIncidentAssignee(
                            incident.assigned_to ||
                            storedUser.full_name ||
                            "Security Analyst"
                          );

                        }}
                      >
                        🔎 View
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>


    {/* ==========================================
        INCIDENT DETAIL PANEL
    ========================================== */}

    {selectedIncident && (

      <div className="result-box">

        <h2>
          🔎 Incident Investigation
        </h2>


        {/* --------------------------------------
            INCIDENT INFORMATION
        -------------------------------------- */}

        <h3>
          🛡️ Incident Information
        </h3>

        <p>
          <strong>
            Incident ID:
          </strong>{" "}
          {selectedIncident.incident_id}
        </p>

        <p>
          <strong>
            Related Alert:
          </strong>{" "}
          ALT-{selectedIncident.alert_id}
        </p>

        <p>
          <strong>
            Dataset:
          </strong>{" "}
          {selectedIncident.dataset}
        </p>

        <p>
          <strong>
            Attack Type:
          </strong>{" "}
          {selectedIncident.attack_type}
        </p>

        <p>
          <strong>
            Severity:
          </strong>{" "}
          {selectedIncident.severity}
        </p>

        <p>
          <strong>
            Risk Score:
          </strong>{" "}
          {selectedIncident.risk_score}/100
        </p>


        {/* --------------------------------------
            ALERT DETAILS
        -------------------------------------- */}

        {(() => {

          const relatedAlert =
            alerts.find(
              (alert) =>
                alert.id ===
                selectedIncident.alert_id
            );

          if (!relatedAlert) {
            return null;
          }

          return (

            <>

              <h3>
                🚨 Detection Details
              </h3>

              <p>
                <strong>
                  Source:
                </strong>{" "}
                {relatedAlert.source ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Source IP:
                </strong>{" "}
                {relatedAlert.source_ip ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Destination IP:
                </strong>{" "}
                {relatedAlert.destination_ip ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Protocol:
                </strong>{" "}
                {relatedAlert.protocol ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Detection:
                </strong>{" "}
                {relatedAlert.detection_details ||
                  "No detection details available."}
              </p>

              <p>
                <strong>
                  Detected At:
                </strong>{" "}
                {relatedAlert.detected_at
                  ? new Date(
                      relatedAlert.detected_at
                    ).toLocaleString()
                  : "Unknown"}
              </p>

            </>

          );

        })()}


        {/* --------------------------------------
            ASSIGNMENT
        -------------------------------------- */}

        <h3>
          👤 Incident Assignment
        </h3>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >

          <input
            type="text"
            value={incidentAssignee}
            onChange={(e) =>
              setIncidentAssignee(
                e.target.value
              )
            }
            placeholder="Security Analyst"
            style={{
              padding: "11px 14px",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,0.15)",
              background: "#0f172a",
              color: "white",
              minWidth: "240px"
            }}
          />


          <button
            onClick={() =>
              updateIncident(
                selectedIncident,
                selectedIncident.status,
                incidentAssignee
              )
            }
          >
            👤 Assign
          </button>

        </div>


        {/* --------------------------------------
            TIMELINE
        -------------------------------------- */}

        <h3>
          🕒 Incident Timeline
        </h3>

        <p>
          <strong>
            Created:
          </strong>{" "}
          {selectedIncident.created_at
            ? new Date(
                selectedIncident.created_at
              ).toLocaleString()
            : "Unknown"}
        </p>

        <p>
          <strong>
            Current Status:
          </strong>{" "}
          {selectedIncident.status}
        </p>

        <p>
          <strong>
            Resolved:
          </strong>{" "}
          {selectedIncident.resolved_at
            ? new Date(
                selectedIncident.resolved_at
              ).toLocaleString()
            : "Not resolved yet"}
        </p>


        {/* --------------------------------------
            ACTIONS
        -------------------------------------- */}

        <div className="response-actions">

          {selectedIncident.status ===
            "Open" && (

            <button
              onClick={() =>
                updateIncident(
                  selectedIncident,
                  "In Progress",
                  incidentAssignee
                )
              }
            >
              🔎 Start Investigation
            </button>

          )}


          {selectedIncident.status ===
            "In Progress" && (

            <button
              onClick={() =>
                updateIncident(
                  selectedIncident,
                  "Resolved",
                  incidentAssignee
                )
              }
            >
              ✅ Resolve Incident
            </button>

          )}


          {selectedIncident.status ===
            "Resolved" && (

            <span
              className="incident-status incident-resolved"
              style={{
                padding: "10px 15px"
              }}
            >
              ✅ Incident Resolved
            </span>

          )}


          <button
            onClick={() =>
              setSelectedIncident(null)
            }
          >
            ✕ Close Details
          </button>

        </div>

      </div>

    )}

  </div>
)}

        {/* ==============================
            ANALYTICS
        ============================== */}

        {activePage === "Analytics" && (
          <>

            <div className="chart-card">

              <h2>
                Protocol Analytics
              </h2>

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={protocolData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                  />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="value"
                    fill="#14b8a6"
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

            <div className="chart-card">

              <h2>
                Live Traffic Trend
              </h2>

              {trafficTrend.length ===
              0 ? (

                <p>
                  Waiting for traffic
                  data...
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={
                      trafficTrend
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="time"
                    />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#14b8a6"
                      strokeWidth={3}
                    />

                  </LineChart>

                </ResponsiveContainer>

              )}

            </div>

            <div className="result-box">

              <h2>
                📋 Recent Activity
              </h2>

              {timeline.length ===
              0 ? (

                <p>
                  No activity yet.
                </p>

              ) : (

                timeline.map(
                  (event) => (

                    <p
                      key={event.id}
                    >
                      ⏰ {event.time} —{" "}
                      {event.event}
                    </p>

                  )
                )

              )}

              {/* ==============================
    SECURITY ANALYTICS
============================== */}

{securityAnalytics && (

  <>

    {/* =========================================
        SUMMARY
    ========================================= */}

    <div className="cards">

      <div className="card">
        <h2>
          {securityAnalytics.summary.total_alerts}
        </h2>
        <p>Total Alerts</p>
      </div>

      <div className="card">
        <h2>
          {securityAnalytics.summary.critical_alerts}
        </h2>
        <p>Critical Alerts</p>
      </div>

      <div className="card">
        <h2>
          {securityAnalytics.summary.high_alerts}
        </h2>
        <p>High Alerts</p>
      </div>

      <div className="card">
        <h2>
          {securityAnalytics.summary.medium_alerts}
        </h2>
        <p>Medium Alerts</p>
      </div>

    </div>


    {/* =========================================
        ATTACK TYPE DISTRIBUTION
    ========================================= */}

    <div className="chart-card">

      <h2>
        🚨 Attack Type Distribution
      </h2>

      {securityAnalytics.attack_distribution.length === 0 ? (

        <p>No attack data available.</p>

      ) : (

        <ResponsiveContainer
          width="100%"
          height={400}
        >

          <PieChart>

            <Pie
              data={
                securityAnalytics.attack_distribution
              }
              dataKey="value"
              nameKey="name"
              outerRadius={140}
              label
            >

              {securityAnalytics.attack_distribution.map(
                (entry, index) => (

                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index %
                        COLORS.length
                      ]
                    }
                  />

                )
              )}

            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      )}

    </div>


    {/* =========================================
        SEVERITY DISTRIBUTION
    ========================================= */}

    <div className="chart-card">

      <h2>
        ⚠️ Severity Distribution
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <BarChart
          data={
            securityAnalytics.severity_distribution
          }
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="name"
          />

          <YAxis />

          <Tooltip />

          <Legend />

          <Bar
            dataKey="value"
            fill="#ef4444"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>


    {/* =========================================
        DATASET DISTRIBUTION
    ========================================= */}

    <div className="chart-card">

      <h2>
        🗂️ Dataset Distribution
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <BarChart
          data={
            securityAnalytics.dataset_distribution
          }
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="name"
          />

          <YAxis />

          <Tooltip />

          <Legend />

          <Bar
            dataKey="value"
            fill="#14b8a6"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>


    {/* =========================================
        DAILY ATTACK TREND
    ========================================= */}

    <div className="chart-card">

      <h2>
        📈 Daily Attack Trend
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <LineChart
          data={
            securityAnalytics.daily_trend
          }
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="date"
          />

          <YAxis />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="attacks"
            stroke="#14b8a6"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>


    {/* =========================================
        WEEKLY SECURITY TREND
    ========================================= */}

    <div className="chart-card">

      <h2>
        📊 Weekly Security Trend
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <LineChart
          data={
            securityAnalytics.weekly_trend
          }
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="week"
          />

          <YAxis />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="attacks"
            stroke="#ef4444"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  </>

)}

            </div>

          </>
        )}


{/* ==============================
    REPORTS
============================== */}

{activePage === "Reports" && (
  <div className="reports-container">

    <h2>📊 Model Performance</h2>

    <div className="buttons">
      <button onClick={downloadReport}>
        📥 Download PDF Report
      </button>
    </div>


    {reportLoading ? (
      <p>Loading model performance...</p>
    ) : !reportData ? (
      <p>No report data available.</p>
    ) : (
      <>

        {/* MODEL SUMMARY CARDS */}

        <div className="cards">

          <div className="card">
            <h2>
              {reportData.intrusion_detection.accuracy}%
            </h2>

            <p>
              Intrusion Detection
            </p>

            <small>
              Random Forest
            </small>
          </div>


          <div className="card">
            <h2>
              {reportData.threat_classification.accuracy}%
            </h2>

            <p>
              Threat Classification
            </p>

            <small>
              Random Forest
            </small>
          </div>


          <div className="card">
            <h2>
              {reportData.anomaly_detection.anomaly_percentage}%
            </h2>

            <p>
              Anomaly Detection
            </p>

            <small>
              Isolation Forest
            </small>
          </div>

        </div>


        {/* INTRUSION DETECTION */}

        <div className="result-box">

          <h2>
            🛡️ Intrusion Detection
          </h2>

          <p>
            <strong>Model:</strong>{" "}
            {reportData.intrusion_detection.model}
          </p>

          <p>
            <strong>Accuracy:</strong>{" "}
            {reportData.intrusion_detection.accuracy}%
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {reportData.intrusion_detection.status}
          </p>

        </div>


        {/* THREAT CLASSIFICATION */}

        <div className="result-box">

          <h2>
            🚨 Threat Classification
          </h2>

          <p>
            <strong>Model:</strong>{" "}
            {reportData.threat_classification.model}
          </p>

          <p>
            <strong>Accuracy:</strong>{" "}
            {reportData.threat_classification.accuracy}%
          </p>

          <p>
            <strong>Precision:</strong>{" "}
            {reportData.threat_classification.precision}%
          </p>

          <p>
            <strong>Recall:</strong>{" "}
            {reportData.threat_classification.recall}%
          </p>

          <p>
            <strong>F1 Score:</strong>{" "}
            {reportData.threat_classification.f1_score}%
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {reportData.threat_classification.status}
          </p>

        </div>


        {/* ANOMALY DETECTION */}

        <div className="result-box">

          <h2>
            🔍 Anomaly Detection
          </h2>

          <p>
            <strong>Model:</strong>{" "}
            {reportData.anomaly_detection.model}
          </p>

          <p>
            <strong>Anomalies Detected:</strong>{" "}
            {reportData.anomaly_detection.anomalies_detected}
          </p>

          <p>
            <strong>Anomaly Percentage:</strong>{" "}
            {reportData.anomaly_detection.anomaly_percentage}%
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {reportData.anomaly_detection.status}
          </p>

        </div>


        {/* SYSTEM STATUS */}

        <div className="result-box">

          <h2>
            🛡️ System Status
          </h2>

          <p>
            {reportData.overall_status}
          </p>

        </div>

      </>
    )}

    {/* ==============================
    SECURITY INCIDENT REPORT
============================== */}

<div className="security-report-section">

  <h2>
    🛡️ Security Incident Report
  </h2>

  {securityReportLoading ? (

    <p>
      Loading security report...
    </p>

  ) : !securityReport ? (

    <p>
      No security report data available.
    </p>

  ) : (

    <>

      {/* ==============================
          SECURITY SUMMARY
      ============================== */}

      <div className="cards">

        <div className="card">
          <h2>
            {securityReport.summary.total_alerts}
          </h2>

          <p>
            Total Alerts
          </p>
        </div>


        <div className="card">
          <h2>
            {securityReport.summary.critical_alerts}
          </h2>

          <p>
            Critical Alerts
          </p>
        </div>


        <div className="card">
          <h2>
            {securityReport.summary.high_alerts}
          </h2>

          <p>
            High Alerts
          </p>
        </div>


        <div className="card">
          <h2>
            {securityReport.summary.total_incidents}
          </h2>

          <p>
            Total Incidents
          </p>
        </div>

      </div>


      {/* ==============================
          INCIDENT STATUS SUMMARY
      ============================== */}

      <div className="cards">

        <div className="card">
          <h2>
            {securityReport.summary.open_incidents}
          </h2>

          <p>
            Open Incidents
          </p>
        </div>


        <div className="card">
          <h2>
            {securityReport.summary.in_progress_incidents}
          </h2>

          <p>
            In Progress
          </p>
        </div>


        <div className="card">
          <h2>
            {securityReport.summary.resolved_incidents}
          </h2>

          <p>
            Resolved Incidents
          </p>
        </div>

      </div>


      {/* ==============================
          SECURITY REPORT TABLE
      ============================== */}

      <div className="result-box">

        <h2>
          📋 Alert & Incident Details
        </h2>

        {securityReport.reports.length === 0 ? (

          <p>
            No security records available.
          </p>

        ) : (

          <div
            style={{
              overflowX: "auto"
            }}
          >

            <table>

              <thead>

                <tr>

                  <th>
                    Alert ID
                  </th>

                  <th>
                    Dataset
                  </th>

                  <th>
                    Attack Type
                  </th>

                  <th>
                    Severity
                  </th>

                  <th>
                    Source
                  </th>

                  <th>
                    Source IP
                  </th>

                  <th>
                    Destination IP
                  </th>

                  <th>
                    Protocol
                  </th>

                  <th>
                    Detection Details
                  </th>

                  <th>
                    Risk
                  </th>

                  <th>
                    Alert Status
                  </th>

                  <th>
                    Incident Status
                  </th>

                  <th>
                    Assigned To
                  </th>

                  <th>
                    Detected At
                  </th>

                </tr>

              </thead>


              <tbody>

                {securityReport.reports.map(
                  (item) => (

                    <tr
                      key={item.alert_id}
                    >

                      <td>
                        ALT-{item.alert_id}
                      </td>


                      <td>

                        <span
                          className={
                            item.dataset ===
                            "CICIDS2017"
                              ? "dataset-badge dataset-cicids"
                              : item.dataset ===
                                "UNSW-NB15"
                              ? "dataset-badge dataset-unsw"
                              : "dataset-badge dataset-combined"
                          }
                        >
                          {item.dataset}
                        </span>

                      </td>


                      <td>
                        {item.attack_type}
                      </td>


                      <td>

                        <span
                          className={`severity-badge ${
                            String(
                              item.severity
                            ).toLowerCase() ===
                            "critical"
                              ? "severity-critical"
                              : String(
                                  item.severity
                                ).toLowerCase() ===
                                "high"
                              ? "severity-high"
                              : String(
                                  item.severity
                                ).toLowerCase() ===
                                "medium"
                              ? "severity-medium"
                              : "severity-low"
                          }`}
                        >
                          {item.severity}
                        </span>

                      </td>


                      <td>
                        {item.source ||
                          "Unknown"}
                      </td>


                      <td>
                        {item.source_ip ||
                          "Unknown"}
                      </td>


                      <td>
                        {item.destination_ip ||
                          "Unknown"}
                      </td>


                      <td>
                        {item.protocol ||
                          "Unknown"}
                      </td>


                      <td
                        style={{
                          minWidth: "300px",
                          textAlign: "left"
                        }}
                      >
                        {item.detection_details ||
                          "No details available."}
                      </td>


                      <td>

                        <span className="risk-score">
                          {item.risk_score ?? 0}
                        </span>

                      </td>


                      <td>

                        <span
                          className={`incident-status ${
                            String(
                              item.alert_status
                            ).toLowerCase() ===
                            "open"
                              ? "incident-open"
                              : item.alert_status ===
                                "In Progress"
                              ? "incident-progress"
                              : "incident-resolved"
                          }`}
                        >
                          {item.alert_status}
                        </span>

                      </td>


                      <td>

                        <span
                          className={`incident-status ${
                            item.incident_status ===
                            "No Incident"
                              ? "incident-open"
                              : item.incident_status ===
                                "In Progress"
                              ? "incident-progress"
                              : item.incident_status ===
                                "Resolved"
                              ? "incident-resolved"
                              : "incident-open"
                          }`}
                        >
                          {item.incident_status}
                        </span>

                      </td>


                      <td>
                        {item.assigned_to ||
                          "Not Assigned"}
                      </td>


                      <td>
                        {item.detected_at
                          ? new Date(
                              item.detected_at
                            ).toLocaleString()
                          : "Unknown"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ==============================
          DOWNLOAD BUTTON
      ============================== */}

      <div className="buttons">

        <button
          onClick={() => {

            if (!securityReport) {
              return;
            }

            const doc = new jsPDF();

            let y = 20;

            doc.setFontSize(22);

            doc.text(
              "NetShield AI",
              20,
              y
            );

            y += 10;

            doc.setFontSize(16);

            doc.text(
              "Security Incident Report",
              20,
              y
            );

            y += 12;

            doc.setFontSize(10);

            doc.text(
              `Generated: ${new Date().toLocaleString()}`,
              20,
              y
            );

            y += 12;

            doc.setFontSize(13);

            doc.text(
              "Security Summary",
              20,
              y
            );

            y += 8;

            doc.setFontSize(10);

            doc.text(
              `Total Alerts: ${securityReport.summary.total_alerts}`,
              20,
              y
            );

            y += 6;

            doc.text(
              `Critical Alerts: ${securityReport.summary.critical_alerts}`,
              20,
              y
            );

            y += 6;

            doc.text(
              `High Alerts: ${securityReport.summary.high_alerts}`,
              20,
              y
            );

            y += 6;

            doc.text(
              `Total Incidents: ${securityReport.summary.total_incidents}`,
              20,
              y
            );

            y += 6;

            doc.text(
              `Open Incidents: ${securityReport.summary.open_incidents}`,
              20,
              y
            );

            y += 6;

            doc.text(
              `In Progress: ${securityReport.summary.in_progress_incidents}`,
              20,
              y
            );

            y += 6;

            doc.text(
              `Resolved Incidents: ${securityReport.summary.resolved_incidents}`,
              20,
              y
            );

            y += 12;

            doc.setFontSize(13);

            doc.text(
              "Security Alerts",
              20,
              y
            );

            y += 8;

            doc.setFontSize(8);

            securityReport.reports
              .slice(0, 25)
              .forEach((item) => {

                if (y > 275) {

                  doc.addPage();

                  y = 20;

                }

                doc.text(
                  `ALT-${item.alert_id} | ${item.dataset} | ${item.attack_type}`,
                  20,
                  y
                );

                y += 5;

                doc.text(
                  `Severity: ${item.severity} | Risk: ${item.risk_score} | Alert: ${item.alert_status}`,
                  20,
                  y
                );

                y += 5;

                doc.text(
                  `Incident: ${item.incident_status} | Assigned: ${item.assigned_to || "Not Assigned"}`,
                  20,
                  y
                );

                y += 5;

                const details =
                  item.detection_details ||
                  "No detection details.";

                const wrapped =
                  doc.splitTextToSize(
                    `Detection: ${details}`,
                    170
                  );

                doc.text(
                  wrapped,
                  20,
                  y
                );

                y +=
                  wrapped.length * 4 + 5;

                doc.text(
                  `Source: ${item.source || "Unknown"} | ${item.source_ip || "Unknown"} → ${item.destination_ip || "Unknown"}`,
                  20,
                  y
                );

                y += 8;

              });


            doc.save(
              "NetShield_AI_Security_Incident_Report.pdf"
            );

          }}
        >
          📥 Download Security Report
        </button>

      </div>

    </>

  )}

</div>

  </div>
)}

{/* ==============================
    MODEL TESTING
============================== */}

{activePage === "ModelTesting" && (
  <ModelTesting />
)}


        {/* ==============================
            PROFILE
        ============================== */}

        {activePage === "Profile" && (
  <div className="profile-container">

    <div className="profile-header">

      <div className="profile-avatar">
        👤
      </div>

      <div>
        <h2>SOC Analyst Profile</h2>

        <p>
          {storedUser.full_name || "Security Analyst"}
        </p>
      </div>

    </div>


    <div className="profile-details">

      <div className="profile-item">
        <span>👤 Full Name</span>

        <strong>
          {storedUser.full_name || "Security Analyst"}
        </strong>
      </div>


      <div className="profile-item">
        <span>📧 Email</span>

        <strong>
          {storedUser.email || "Not available"}
        </strong>
      </div>


      <div className="profile-item">
        <span>💼 Role</span>

        <strong>
          Security Analyst
        </strong>
      </div>


      <div className="profile-item">
        <span>🛡️ System</span>

        <strong>
          NetShield AI
        </strong>
      </div>


      <div className="profile-item">
        <span>🟢 Account Status</span>

        <strong>
          Active
        </strong>
      </div>


      <div className="profile-item">
        <span>🔐 Access Level</span>

        <strong>
          Monitoring & Reports
        </strong>
      </div>


      <div className="profile-item">
        <span>🤖 AI Access</span>

        <strong>
          Model Testing & Analysis
        </strong>
      </div>

    </div>


    <div className="result-box">

      <h3>
        🔒 Security Responsibilities
      </h3>

      <p>
        • Monitor network traffic and security alerts
      </p>

      <p>
        • Analyze suspicious network activity
      </p>

      <p>
        • Review AI-based threat predictions
      </p>

      <p>
        • Investigate and respond to detected threats
      </p>

      <p>
        • Monitor AI model performance
      </p>

    </div>

  </div>
)}

      </main>

    </div>
  );
}

export default AnalystDashboard;