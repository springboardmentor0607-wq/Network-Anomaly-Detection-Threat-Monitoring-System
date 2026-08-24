import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrafficContext } from '../context/TrafficContext';
import toast from 'react-hot-toast';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const NetworkAnomaly = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const { anomalies, setAnomalies, stats, setStats } = useContext(TrafficContext);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runManualTest = async (isAttack) => {
    setLoading(true);
    setTestResult(null);
    try {
      const response = await fetch('http://localhost:8000/api/predict-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_attack: isAttack, features: Array(78).fill(0.0) })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.detail) {
        setTestResult({ error: data.detail || "Model service unavailable", is_anomaly: false });
        return;
      }
      
      setTestResult(data);

      if (data.is_anomaly && setAnomalies) {
        const confNum = parseFloat(data.confidence) || 98.0;
        let dynamicSeverity = confNum >= 98.0 ? 'Critical' : confNum >= 95.0 ? 'High' : 'Medium';
        const threatType = data.ai_classification || data.prediction || 'Malicious Signature';

        const newManualThreat = {
          id: `manual_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          source: 'Manual Tester Sandbox',
          type: threatType,
          description: 'Manually injected test signature',
          severity: dynamicSeverity,
          confidence: data.confidence || '98.5%'
        };

        setAnomalies(prev => [newManualThreat, ...prev].slice(0, 50));
        
        toast.error(
          (t) => (
            <div className="cursor-pointer flex flex-col gap-1 w-full" onClick={() => { navigate('/dashboard/threats'); toast.dismiss(t.id); }}>
              <span className={`font-bold text-[13px] tracking-wide uppercase ${dynamicSeverity === 'Critical' ? 'text-red-400' : 'text-orange-400'}`}>
                {dynamicSeverity} Threat Detected
              </span>
              <span className="text-[12px] text-white">{threatType} ({data.confidence})</span>
            </div>
          ), 
          { duration: 6000, position: 'top-right', style: { cursor: 'pointer', minWidth: '250px' } }
        );
      }
    } catch (err) {
      console.error("Test failed", err);
      setTestResult({ error: "Backend connection error", is_anomaly: false });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (anomalies.length === 0) {
      alert("No anomalies detected yet. Nothing to export.");
      return;
    }
    const headers = ['Timestamp', 'Source', 'Threat Classification', 'Description', 'Severity', 'AI Confidence'];
    const dataToExport = filter === 'All' ? anomalies : anomalies.filter(a => a.severity === filter);
    const rows = dataToExport.map(a => [`"${a.time}"`, `"${a.source}"`, `"${a.type}"`, `"${a.description}"`, `"${a.severity}"`, `"${a.confidence}"`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NetShield_Threat_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const attackCounts = anomalies.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  const doughnutData = {
    labels: Object.keys(attackCounts).length > 0 ? Object.keys(attackCounts) : ['No Threats'],
    datasets: [{
      data: Object.keys(attackCounts).length > 0 ? Object.values(attackCounts) : [1],
      backgroundColor: ['#F87171', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#9A9A97', font: { size: 11 } } } },
    cutout: '75%'
  };

  // --- CLEAN TIMELINE LINE CHART CONFIG ---
  const recentAnomalies = [...anomalies].reverse().slice(-15); // Last 15 threats
  
  const timelineData = {
    labels: recentAnomalies.map(a => a.time),
    datasets: [{
      label: 'Threat Severity Index',
      data: recentAnomalies.map(a => a.severity === 'Critical' ? 3 : a.severity === 'High' ? 2 : 1),
      borderColor: '#F87171',
      backgroundColor: 'rgba(248, 113, 113, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#F87171',
    }]
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const item = recentAnomalies[index];
            return ` [${item.severity}] ${item.type} (${item.confidence})`;
          }
        }
      }
    },
    scales: { 
      x: { 
        grid: { display: false }, 
        ticks: { color: '#9A9A97', maxTicksLimit: 6, font: { size: 10 } } 
      }, 
      y: { 
        min: 0, 
        max: 4, 
        grid: { color: 'rgba(255,255,255,0.05)' }, 
        ticks: { 
          color: '#9A9A97', 
          stepSize: 1,
          callback: (val) => val === 3 ? 'Critical' : val === 2 ? 'High' : val === 1 ? 'Medium' : '' 
        } 
      } 
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F2F2F0]">Behavioral Analysis Engine</h2>
          <p className="text-[13px] text-[#9A9A97]">Monitoring baseline deviations and pattern recognition</p>
        </div>
        <div className="flex items-center gap-4 bg-[#0A0A0B]/60 border border-white/[0.07] px-4 py-2 rounded-lg">
          <span className="text-[13px] text-emerald-400 font-medium animate-pulse">Monitoring Port 8000</span>
        </div>
      </div>

      {/* INTERACTIVE MODEL TESTER */}
      <div className="bg-[#0A0A0B]/80 border border-indigo-500/30 rounded-xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#F2F2F0]">Interactive AI Model Tester</h3>
            <p className="text-[12px] text-[#9A9A97]">Manually simulate and test signatures against the detection engine</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => runManualTest(false)} disabled={loading} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[12px] font-medium hover:bg-emerald-500/20 cursor-pointer">
              {loading ? 'Testing...' : 'Test Safe Packet'}
            </button>
            <button onClick={() => runManualTest(true)} disabled={loading} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[12px] font-medium hover:bg-red-500/20 cursor-pointer">
              {loading ? 'Testing...' : 'Test Attack Packet'}
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border text-[13px] flex items-center justify-between ${testResult.is_anomaly ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
            <div>
              <span className="font-semibold uppercase tracking-wider text-[11px] opacity-75 block mb-0.5">Classification Verdict</span>
              <span className="text-[16px] font-bold tracking-wide">{testResult.ai_classification || testResult.prediction || 'BENIGN'}</span>
            </div>
          </div>
        )}
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Deviations (Session)', value: stats.totalDeviations.toString(), trend: 'Live AI Detections' },
          { label: 'Critical Anomalies', value: anomalies.filter(a => a.severity === 'Critical').length.toString(), trend: 'Requires immediate review' },
          { label: 'False Positive Rate', value: '0.23%', trend: 'Based on OOB Validation' },
          { label: 'Network Risk Score', value: `${stats.riskScore}/100`, trend: 'Dynamic Risk Index' },
        ].map((metric, i) => (
          <div key={i} className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-5">
            <h3 className="text-[13px] font-medium text-[#9A9A97] mb-1">{metric.label}</h3>
            <div className="text-[24px] font-semibold text-[#F2F2F0] mb-2">{metric.value}</div>
            <div className="text-[12px] text-[#9A9A97]">{metric.trend}</div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6 h-80 flex flex-col">
          <h2 className="text-[15px] font-medium mb-4">Anomaly Severity Timeline</h2>
          <div className="flex-1 relative w-full h-full">
            <Line data={timelineData} options={timelineOptions} />
          </div>
        </div>
        <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6 h-80 flex flex-col">
          <h2 className="text-[15px] font-medium mb-4">Threat Distribution</h2>
          <div className="flex-1 relative w-full h-full flex justify-center pb-4">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* THREAT LOG TABLE */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-[15px] font-medium">Live Threat Log</h2>
          <button onClick={downloadReport} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-md text-[11px] font-semibold hover:bg-indigo-500/20 cursor-pointer">
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] border-b border-white/[0.07] text-[#9A9A97] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Time</th>
                <th className="px-6 py-3 font-semibold">Source</th>
                <th className="px-6 py-3 font-semibold">Classification</th>
                <th className="px-6 py-3 font-semibold">Severity</th>
                <th className="px-6 py-3 font-semibold">AI Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {anomalies.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-[#9A9A97] text-[13px]">No threats detected yet.</td></tr>
              ) : (
                anomalies.map((anomaly) => (
                  <tr key={anomaly.id} className="hover:bg-red-500/5 text-[13px]">
                    <td className="px-6 py-4 text-[#9A9A97] whitespace-nowrap">{anomaly.time}</td>
                    <td className="px-6 py-4 font-mono text-[#D6D6D3]">{anomaly.source}</td>
                    <td className="px-6 py-4 font-medium text-[#F2F2F0]">{anomaly.type}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getSeverityStyle(anomaly.severity)}`}>{anomaly.severity}</span></td>
                    <td className="px-6 py-4 font-mono text-[#D6D6D3]">{anomaly.confidence}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default NetworkAnomaly;