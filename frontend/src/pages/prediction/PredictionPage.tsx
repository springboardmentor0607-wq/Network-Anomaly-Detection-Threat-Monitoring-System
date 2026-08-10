import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Zap, AlertTriangle, ShieldAlert, ArrowRight, CheckCircle, BarChart, Activity } from 'lucide-react';

interface PredictionItem {
  id: string;
  sourceIp: string;
  destIp: string;
  attackCategory: string;
  probability: number;
  riskScore: number;
  confidence: number;
  recommendedAction: string;
  priority: 'P1 - CRITICAL' | 'P2 - HIGH' | 'P3 - MEDIUM' | 'P4 - LOW';
  timestamp: string;
}

export const PredictionPage: React.FC = () => {
  const [predictions] = useState<PredictionItem[]>([
    {
      id: 'PRD-9041',
      sourceIp: '42.112.98.14',
      destIp: '192.168.1.100 (API Gateway)',
      attackCategory: 'DDoS SYN Flood',
      probability: 0.96,
      riskScore: 96,
      confidence: 0.94,
      recommendedAction: 'Apply rate-limiting rule at edge router and block source IP 42.112.98.14.',
      priority: 'P1 - CRITICAL',
      timestamp: '2026-08-10T09:42:10Z',
    },
    {
      id: 'PRD-9040',
      sourceIp: '185.220.101.5',
      destIp: '192.168.1.250 (PostgreSQL Cluster)',
      attackCategory: 'SSH Brute Force / Credential Dumping',
      probability: 0.88,
      riskScore: 84,
      confidence: 0.91,
      recommendedAction: 'Trigger Fail2ban isolation and rotate database master credentials.',
      priority: 'P2 - HIGH',
      timestamp: '2026-08-10T09:28:45Z',
    },
    {
      id: 'PRD-9039',
      sourceIp: '194.26.29.112',
      destIp: 'WS-FINANCE-08 (192.168.1.44)',
      attackCategory: 'DNS Tunneling Exfiltration',
      probability: 0.74,
      riskScore: 68,
      confidence: 0.85,
      recommendedAction: 'Isolate workstation WS-FINANCE-08 from local subnet and run EDR agent scan.',
      priority: 'P2 - HIGH',
      timestamp: '2026-08-10T08:15:30Z',
    },
    {
      id: 'PRD-9038',
      sourceIp: '103.251.140.2',
      destIp: '192.168.1.105 (Auth Server)',
      attackCategory: 'Port Scan / Reconnaissance',
      probability: 0.52,
      riskScore: 42,
      confidence: 0.79,
      recommendedAction: 'Monitor connection volume. Flag source IP in firewall telemetry watch list.',
      priority: 'P3 - MEDIUM',
      timestamp: '2026-08-10T07:10:00Z',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Intrusion Prediction Engine</h2>
          <p className="text-xs text-gray-400">Predictive attack classification, probability analysis, and pre-emptive recommended actions.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#0F172A] border-[#1F2937]">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>High Probability Threats</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">3 Active</p>
        </Card>
        <Card className="p-4 bg-[#0F172A] border-[#1F2937]">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Avg ML Confidence</span>
            <BarChart className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-cyan-400">92.4%</p>
        </Card>
        <Card className="p-4 bg-[#0F172A] border-[#1F2937]">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Critical Priority (P1)</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-400">1 Incident</p>
        </Card>
        <Card className="p-4 bg-[#0F172A] border-[#1F2937]">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>Pre-emptive Containments</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">14 Executed</p>
        </Card>
      </div>

      {/* Predictions Queue */}
      <div className="space-y-4">
        {predictions.map((item) => (
          <Card key={item.id} className="p-5 border-[#1F2937] hover:border-cyan-500/30 transition">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded">
                    {item.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                      item.priority.includes('CRITICAL')
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs text-gray-400">{item.timestamp}</span>
                </div>

                <h3 className="text-base font-bold text-white">{item.attackCategory}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1">
                  <span>Source IP: <strong className="text-cyan-400">{item.sourceIp}</strong></span>
                  <span>Target: <strong className="text-white">{item.destIp}</strong></span>
                  <span>Confidence: <strong className="text-emerald-400">{(item.confidence * 100).toFixed(0)}%</strong></span>
                </div>

                <div className="p-3 bg-[#0B0F17] border border-[#1F2937] rounded-xl text-xs text-gray-300 flex items-start space-x-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Recommended SOC Action:</strong> {item.recommendedAction}</span>
                </div>
              </div>

              {/* Risk Score & Probability Visual Gauges */}
              <div className="flex items-center space-x-6 border-t lg:border-t-0 lg:border-l border-[#1F2937] pt-4 lg:pt-0 lg:pl-6 shrink-0">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Attack Probability</span>
                  <div className="mt-1 relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-950/60 border-2 border-cyan-500 text-cyan-400 font-bold text-sm">
                    {(item.probability * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Risk Score</span>
                  <div className={`mt-1 relative inline-flex items-center justify-center w-16 h-16 rounded-full border-2 text-sm font-bold ${
                    item.riskScore > 80 ? 'bg-red-950/60 border-red-500 text-red-400' : 'bg-amber-950/60 border-amber-500 text-amber-400'
                  }`}>
                    {item.riskScore}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
