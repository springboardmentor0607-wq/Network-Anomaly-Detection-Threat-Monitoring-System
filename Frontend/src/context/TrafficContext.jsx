import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast'; 
import { useNavigate } from 'react-router-dom';

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

  // Royal Upgrade: Independent Global Hydration
  // Fetches authoritative MongoDB baseline exactly ONCE when the app boots or refreshes
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
  }, []); // Empty array ensures this survives dataset toggles and only fires on hard refresh

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

        toast.error(
          (t) => (
            <div 
              className="cursor-pointer flex flex-col gap-1 w-full" 
              onClick={() => { 
                navigate('/dashboard/threats'); 
                toast.dismiss(t.id);           
              }}
            >
              <span className="font-bold text-[13px] tracking-wide uppercase text-red-400">
                CRITICAL THREAT DETECTED
              </span>
              <span className="text-[12px] text-white">[{threatName}] originating from {sourceIp}</span>
              <span className="text-[10px] text-red-400/80 mt-1 italic">Click here to investigate incident &rarr;</span>
            </div>
          ),
          { duration: 6000, position: 'top-right', style: { cursor: 'pointer', minWidth: '280px', background: '#0A0A0B', border: '1px solid #ef4444' } }
        );

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