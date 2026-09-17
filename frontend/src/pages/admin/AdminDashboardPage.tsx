import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  ClipboardList,
  Server,
  Database,
  Cpu,
  Settings,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Zap,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_RECENT_ALERTS, MOCK_INCIDENTS } from '../../constants/mockDashboardData';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Portal Header Banner */}
      <div className="p-6 bg-gradient-to-r from-red-950/60 via-[#111827] to-[#0B0F17] border border-red-500/40 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2.5 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>SYSTEM ADMINISTRATOR CONTROL PORTAL</span>
                <span className="px-2.5 py-0.5 text-[10px] font-black bg-red-500 text-white rounded uppercase tracking-widest">
                  ROOT ADMIN
                </span>
              </h1>
              <p className="text-xs text-gray-300">
                Privileged System Management • User Access Control • System Audit Trail • AI Infrastructure Control
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/users')}
            icon={<Users className="w-4 h-4" />}
            className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-950/50"
          >
            Manage Users & Roles
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/audit-logs')}
            icon={<ClipboardList className="w-4 h-4 text-red-400" />}
          >
            Audit Logs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            icon={<Settings className="w-4 h-4 text-gray-300" />}
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Admin High-Level Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Operators"
          value="18 Active Users"
          change="+3 this week"
          isPositive={true}
          icon={<Users className="w-5 h-5 text-red-400" />}
          subtitle="4 Roles Configured"
        />
        <StatCard
          title="System Audit Log Entries"
          value="42,890 Logs"
          change="100% Retained"
          isPositive={true}
          icon={<ClipboardList className="w-5 h-5 text-indigo-400" />}
          subtitle="Immutable Security Trail"
        />
        <StatCard
          title="Inference Engine RAM"
          value="1.24 GB Used"
          change="Optimal"
          isPositive={true}
          icon={<Cpu className="w-5 h-5 text-purple-400" />}
          subtitle="XGBoost & Isolation Forest"
        />
        <StatCard
          title="Database Connections"
          value="14 Active Pools"
          change="12ms Latency"
          isPositive={true}
          icon={<Database className="w-5 h-5 text-emerald-400" />}
          subtitle="SQLAlchemy / PostgreSQL"
        />
      </div>

      {/* Privileged Management Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Account Access Overview Panel */}
        <Card title="User Account Access Overview" subtitle="Registered platform operators & active permissions" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131C2E] text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Operator Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937] text-gray-200">
                <tr className="hover:bg-[#131C2E]/60 transition">
                  <td className="p-3 font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-red-400" />
                    <span>System Administrator</span>
                  </td>
                  <td className="p-3 font-mono text-cyan-400">admin@netshield.ai</td>
                  <td className="p-3"><span className="px-2 py-0.5 text-[10px] font-black bg-red-950 text-red-400 border border-red-500/40 rounded">ADMIN</span></td>
                  <td className="p-3"><span className="text-emerald-400 font-bold">ACTIVE</span></td>
                  <td className="p-3 text-right"><button onClick={() => navigate('/admin/users')} className="text-cyan-400 hover:underline font-bold">Edit Role</button></td>
                </tr>
                <tr className="hover:bg-[#131C2E]/60 transition">
                  <td className="p-3 font-bold text-white flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>SOC Lead Manager</span>
                  </td>
                  <td className="p-3 font-mono text-cyan-400">manager@netshield.ai</td>
                  <td className="p-3"><span className="px-2 py-0.5 text-[10px] font-black bg-indigo-950 text-indigo-400 border border-indigo-500/40 rounded">SOC_MANAGER</span></td>
                  <td className="p-3"><span className="text-emerald-400 font-bold">ACTIVE</span></td>
                  <td className="p-3 text-right"><button onClick={() => navigate('/admin/users')} className="text-cyan-400 hover:underline font-bold">Edit Role</button></td>
                </tr>
                <tr className="hover:bg-[#131C2E]/60 transition">
                  <td className="p-3 font-bold text-white flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Lead Security Analyst</span>
                  </td>
                  <td className="p-3 font-mono text-cyan-400">analyst@netshield.ai</td>
                  <td className="p-3"><span className="px-2 py-0.5 text-[10px] font-black bg-cyan-950 text-cyan-400 border border-cyan-500/40 rounded">SECURITY_ANALYST</span></td>
                  <td className="p-3"><span className="text-emerald-400 font-bold">ACTIVE</span></td>
                  <td className="p-3 text-right"><button onClick={() => navigate('/admin/users')} className="text-cyan-400 hover:underline font-bold">Edit Role</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* System Health Matrix */}
        <Card title="System Health Matrix" subtitle="Core microservices status">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#131C2E] rounded-xl border border-[#1F2937]">
              <div className="flex items-center space-x-2.5">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-200 font-medium">FastAPI Backend API</span>
              </div>
              <span className="text-emerald-400 font-bold">100% ONLINE (12ms)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#131C2E] rounded-xl border border-[#1F2937]">
              <div className="flex items-center space-x-2.5">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-200 font-medium">PostgreSQL Engine</span>
              </div>
              <span className="text-emerald-400 font-bold">HEALTHY</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#131C2E] rounded-xl border border-[#1F2937]">
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-gray-200 font-medium">ML Inference RAM</span>
              </div>
              <span className="text-emerald-400 font-bold">LOADED</span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/settings')}
                className="w-full py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold rounded-xl transition text-center"
              >
                Configure System Thresholds
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Model Deployment & Security Incident Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="AI Models Deployment Control" subtitle="Production inference model lifecycle status">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#131C2E] rounded-xl border border-[#1F2937] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">NetShield XGBoost Classifier v2.4.1</h4>
                <p className="text-gray-400 text-[11px]">Supervised Attack Classification • Accuracy: 98.42%</p>
              </div>
              <button onClick={() => navigate('/models')} className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold rounded-lg text-xs">
                ACTIVE
              </button>
            </div>
            <div className="p-3 bg-[#131C2E] rounded-xl border border-[#1F2937] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Isolation Forest Baseline v3.0.0</h4>
                <p className="text-gray-400 text-[11px]">Unsupervised Anomaly Detector • Accuracy: 94.10%</p>
              </div>
              <button onClick={() => navigate('/models')} className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold rounded-lg text-xs">
                ACTIVE
              </button>
            </div>
          </div>
        </Card>

        <Card title="Active Incident Escalations" subtitle="Privileged threat containment queue">
          <div className="space-y-3 text-xs">
            {MOCK_INCIDENTS.map((inc) => (
              <div key={inc.id} className="p-3 bg-[#131C2E] rounded-xl border border-[#1F2937] flex items-center justify-between">
                <div>
                  <span className="font-mono text-cyan-400 font-bold">{inc.incident_id}</span>
                  <h4 className="font-bold text-white truncate max-w-xs">{inc.title}</h4>
                </div>
                <button onClick={() => navigate('/incidents')} className="px-3 py-1.5 bg-red-950 text-red-400 border border-red-500/40 font-bold rounded-lg text-xs">
                  Manage Escalation
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
