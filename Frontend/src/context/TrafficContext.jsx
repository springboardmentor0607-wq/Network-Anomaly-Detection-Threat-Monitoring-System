import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 

// Create the context
export const TrafficContext = createContext();

export const TrafficProvider = ({ children }) => {
  // Global State for Network Traffic Page
  const [selectedDataset, setSelectedDataset] = useState('cicids2017');
  const [packets, setPackets] = useState([]);
  const [columns, setColumns] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [status, setStatus] = useState('Connecting...');
  
  // Global State for Network Anomaly Page
  const [anomalies, setAnomalies] = useState([]);
  
  // --- DERIVED LIVE ANOMALY COUNT ---
  const anomalyCount = anomalies.length;

  const [stats, setStats] = useState({
    totalScanned: 0,
    totalDeviations: 0,
    riskScore: 12
  });

  // --- AUTHORITATIVE BACKEND RISK & STATS SYNC ---
  const fetchBackendStats = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/network/stats');
      const data = await res.json();
      if (data.status === 'success') {
        setStats({
          totalScanned: data.totalScanned,
          totalDeviations: data.totalDeviations,
          riskScore: data.riskScore
        });
      }
    } catch (err) {
      console.error("Failed to fetch backend stats:", err);
    }
  };

  useEffect(() => {
    // 1. Reset stream-specific state
    setPackets([]);
    setChartData([]);
    setStatus('Connecting...');

    // 2. Fetch Persistent MongoDB History & Backend Stats
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts/history');
        const data = await res.json();
        
        if (data.status === 'success' && data.anomalies) {
          setAnomalies(data.anomalies);
        }
      } catch (err) {
        console.error("Failed to fetch DB history:", err);
        setAnomalies([]);
      }
    };

    fetchHistory();
    fetchBackendStats();

    // Poll backend risk engine every 5 seconds to stay fully synchronized
    const statsInterval = setInterval(fetchBackendStats, 5000);

    // 3. Open WebSocket Connection
    const ws = new WebSocket(`ws://localhost:8000/ws/traffic/stream?dataset=${selectedDataset}`);

    ws.onopen = () => setStatus('Live Stream Active');
    ws.onclose = () => setStatus('Disconnected');
    ws.onerror = () => setStatus('Connection Error');

    ws.onmessage = (event) => {
      const packet = JSON.parse(event.data);

      // 1. Update Traffic Page Data
      const excludedKeys = ['active_dataset', 'ai_classification', 'is_anomaly'];
      setColumns(Object.keys(packet).filter(k => !excludedKeys.includes(k)).slice(0, 4)); 
      setPackets(prev => [packet, ...prev].slice(0, 10));
      
      const bandwidthMetric = packet[' Total Length of Fwd Packets'] || packet['Total Length of Fwd Packets'] || packet['spkts'] || 0;
      setChartData(prev => [...prev, bandwidthMetric].slice(-15));

      // 2. Update Anomaly Page Data & Fire Toast
      if (packet.is_anomaly) {
        const threatName = packet.ai_classification || 'Unknown Threat';
        const sourceIp = packet['Source IP'] || 'Mac Interface';

        toast.error(`CRITICAL THREAT: [${threatName}] from ${sourceIp}`, {
          duration: 4000,
          position: 'top-right',
          style: { background: '#0A0A0B', color: '#ef4444', border: '1px solid #7f1d1d', fontSize: '13px', fontWeight: '600' },
          iconTheme: { primary: '#ef4444', secondary: '#0A0A0B' },
        });

        const newAnomaly = {
          id: `anm_${Math.floor(Math.random() * 10000)}`,
          time: new Date().toLocaleTimeString(),
          source: 'Live WebSocket Stream', 
          type: threatName,
          description: 'Deviates from standard baseline behavior',
          severity: 'Critical',
          confidence: '99.7%'
        };
        
        setAnomalies(prev => [newAnomaly, ...prev].slice(0, 50));
        
        // Instantly re-sync backend risk score upon detecting a live threat
        fetchBackendStats();
      }

      // Increment packet counter smoothly
      setStats(prev => ({
        ...prev,
        totalScanned: prev.totalScanned + 1
      }));
    };

    return () => {
      ws.close();
      clearInterval(statsInterval);
    };
  }, [selectedDataset]);

  return (
    <TrafficContext.Provider value={{ 
      selectedDataset, setSelectedDataset, packets, columns, chartData, 
      status, anomalyCount, anomalies, setAnomalies, stats, setStats 
    }}>
      {children}
    </TrafficContext.Provider>
  );
};

export default TrafficProvider;