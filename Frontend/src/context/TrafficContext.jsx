import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const TrafficContext = createContext();

export const TrafficProvider = ({ children }) => {
  const navigate = useNavigate();

  // Global State
  const [selectedDataset, setSelectedDataset] = useState('cicids2017');
  const [packets, setPackets] = useState([]);
  const [columns, setColumns] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [status, setStatus] = useState('Connecting...');
  const [anomalies, setAnomalies] = useState([]);
  const anomalyCount = anomalies.length;

  const [stats, setStats] = useState({
    totalScanned: 0,
    totalDeviations: 0,
    riskScore: 12
  });

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
    const fetchGlobalBaseline = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/alerts');
        const data = await res.json();
        
        if (data.status === 'success' && data.alerts) {
          setAnomalies(data.alerts.slice(0, 50));
        }
      } catch (err) {
        console.error("Failed to hydrate global baseline:", err);
      }
    };

    fetchGlobalBaseline();
    fetchBackendStats();
  }, []);

  // WebSocket & Live Stream Engine
  useEffect(() => {
    setPackets([]);
    setChartData([]);
    setStatus('Connecting...');

    const statsInterval = setInterval(fetchBackendStats, 5000);
    const ws = new WebSocket(`ws://localhost:8000/ws/traffic/stream?dataset=${selectedDataset}`);

    ws.onopen = () => setStatus('Live Stream Active');
    ws.onclose = () => setStatus('Disconnected');
    ws.onerror = () => setStatus('Connection Error');

    ws.onmessage = (event) => {
      const packet = JSON.parse(event.data);

      const excludedKeys = ['active_dataset', 'ai_classification', 'is_anomaly'];
      setColumns(Object.keys(packet).filter(k => !excludedKeys.includes(k)).slice(0, 4)); 
      setPackets(prev => [packet, ...prev].slice(0, 10));
      
      const bandwidthMetric = packet[' Total Length of Fwd Packets'] || packet['Total Length of Fwd Packets'] || packet['spkts'] || 0;
      setChartData(prev => [...prev, bandwidthMetric].slice(-15));

      if (packet.is_anomaly) {
        const threatName = packet.ai_classification || 'Unknown Threat';
        const sourceIp = packet['Source IP'] || 'Mac Interface';

        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="cursor-pointer flex flex-col w-[320px] p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-transform active:scale-95"
            // We use inline styles here to easily read the CSS variables dictated by your light/dark mode switch
            style={{
              background: 'var(--toast-bg, rgba(20, 20, 22, 0.75))',
              border: '1px solid var(--toast-border, rgba(239, 68, 68, 0.3))', // Red border for alerts
              color: 'var(--toast-text, #F2F2F0)',
            }}
            onClick={() => { 
              navigate('/dashboard/threats'); 
              toast.dismiss(t.id);           
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="font-bold text-[12px] tracking-tight uppercase text-red-500">
                Critical Threat Detected
              </span>
            </div>
            
            <p className="text-[13px] font-medium leading-snug">
              {threatName} originating from <span className="font-mono text-red-500">{sourceIp}</span>
            </p>
            
            <span className="text-[11px] opacity-60 mt-2 font-medium">Click to investigate incident &rarr;</span>
          </motion.div>
        ), { id: `alert-${Date.now()}` }); // Unique ID ensures they stack properly

        const newAnomaly = {
          id: `anm_${Math.floor(Math.random() * 10000)}`,
          time: new Date().toLocaleTimeString(),
          source: sourceIp, 
          type: threatName,
          description: 'Deviates from standard baseline behavior',
          severity: 'Critical',
          confidence: '99.7%'
        };
        
        setAnomalies(prev => [newAnomaly, ...prev].slice(0, 50));
        fetchBackendStats();
      }

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