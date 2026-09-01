import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Cpu, Filter, Eye, ChevronLeft, ChevronRight, X, Activity } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { anomaliesApi, AnomalyItem } from '../../api/anomalies';
import { INITIAL_MOCK_FLOWS } from '../../constants/mockTrafficData';

export const AnomaliesPage: React.FC = () => {
  const { token } = useAuth();
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [minScore, setMinScore] = useState<number>(0.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected anomaly for detail drawer
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);

  useEffect(() => {
    const fetchAnomalies = async () => {
      setIsLoading(true);
      if (token) {
        try {
          const res = await anomaliesApi.getAnomalies(token, page, pageSize, minScore > 0 ? minScore : undefined);
          setAnomalies(res.items);
          setTotal(res.total);
          setIsLoading(false);
          return;
        } catch (err) {
          console.warn('Backend API connection offline, using mock anomaly dataset', err);
        }
      }

      // Fallback mock anomalies mapping
      const mockItems: AnomalyItem[] = INITIAL_MOCK_FLOWS.map((f, idx) => ({
        id: `ANOM-${idx + 100}`,
        flow_id: f.id,
        anomaly_score: f.anomaly_score,
        is_anomaly: f.status === 'anomalous',
        model_name: 'Isolation Forest Anomaly Baseline',
        model_version: '1.0.0',
        contributing_features: {
          'Flow Duration': `${f.duration}s`,
          'Total Bytes': `${f.bytes} B`,
          'Packets Rate': `${f.packets} pkts`,
        },
        created_at: f.timestamp,
        flow: {
          source_ip: f.source_ip,
          destination_ip: f.destination_ip,
          source_port: f.source_port,
          destination_port: f.destination_port,
          protocol: f.protocol,
          packets: f.packets,
          bytes: f.bytes,
          duration: f.duration,
        },
      }));
      setAnomalies(mockItems.filter((item) => item.anomaly_score >= minScore));
      setTotal(mockItems.length);
      setIsLoading(false);
    };

    fetchAnomalies();
  }, [token, page, pageSize, minScore]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>AI Anomaly Detection Matrix</span>
          </h2>
          <p className="text-xs text-gray-400">
            Unsupervised Isolation Forest statistical deviation detection & feature explanations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Total Flagged Anomalies</p>
            <p className="text-xl font-bold text-white mt-0.5">{total}</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">High Anomaly Threshold</p>
            <p className="text-xl font-bold text-red-400 mt-0.5">Score &gt;= 0.75</p>
          </div>
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Model Baseline</p>
            <p className="text-xl font-bold text-cyan-400 mt-0.5">IsolationForest v1.0</p>
          </div>
          <Cpu className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Feature Dimension</p>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">10 Numeric/Cat</p>
          </div>
          <Activity className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 font-medium">Min Anomaly Score Filter:</span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={minScore}
              onChange={(e) => {
                setMinScore(parseFloat(e.target.value));
                setPage(1);
              }}
              className="w-40 accent-cyan-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-cyan-400">{minScore.toFixed(2)}</span>
          </div>

          <div className="flex items-center space-x-2 text-gray-400">
            <span>Per Page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#131C2E] border border-[#1F2937] rounded px-2.5 py-1 text-cyan-400 font-semibold focus:outline-none"
            >
              <option value={5} className="bg-[#111827]">5</option>
              <option value={10} className="bg-[#111827]">10</option>
              <option value={25} className="bg-[#111827]">25</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Anomalies Table */}
      <Card title={`Detected Anomaly Telemetry Records (${total} Total)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131C2E] text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Source → Destination</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Anomaly Score</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Model</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">Loading anomalies...</td>
                </tr>
              ) : anomalies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No anomalies matching score threshold &gt;= {minScore}.</td>
                </tr>
              ) : (
                anomalies.map((item) => (
                  <tr key={item.id} className="hover:bg-[#131C2E]/60 transition">
                    <td className="p-3 font-mono font-bold text-cyan-400">{item.id.substring(0, 8)}</td>
                    <td className="p-3 font-mono text-gray-400">{new Date(item.created_at).toLocaleTimeString()}</td>
                    <td className="p-3 font-mono text-gray-200">
                      {item.flow?.source_ip || '192.168.1.45'} → <span className="text-cyan-400 font-semibold">{item.flow?.destination_ip || '10.0.0.12'}</span>
                    </td>
                    <td className="p-3 font-bold text-gray-300">{item.flow?.protocol || 'TCP'}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.anomaly_score * 100)}%` }}
                          />
                        </div>
                        <span>{(item.anomaly_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {item.is_anomaly ? (
                        <Badge variant="red" size="sm">ANOMALOUS</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">NORMAL</Badge>
                      )}
                    </td>
                    <td className="p-3 text-gray-400">{item.model_name} ({item.model_version})</td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAnomaly(item)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[#1F2937] pt-4 mt-4 text-xs">
          <span className="text-gray-400">
            Page <span className="font-bold text-white">{page}</span> of <span className="font-bold text-white">{totalPages}</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-[#131C2E] border border-[#1F2937] rounded text-gray-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-[#131C2E] border border-[#1F2937] rounded text-gray-300 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Feature Contribution Detail Drawer Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-lg bg-[#111827] border-l border-[#1F2937] p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Anomaly Feature Inspection</h3>
                <p className="text-xs font-mono text-cyan-400">ID: {selectedAnomaly.id}</p>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1E293B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#131C2E] border border-[#1F2937] rounded-xl space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">Detection Summary</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Anomaly Score:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {(selectedAnomaly.anomaly_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Decision:</span>
                  <Badge variant={selectedAnomaly.is_anomaly ? 'red' : 'emerald'} size="sm">
                    {selectedAnomaly.is_anomaly ? 'ANOMALOUS' : 'NORMAL'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Model Algorithm:</span>
                  <span className="font-semibold text-white">{selectedAnomaly.model_name}</span>
                </div>
              </div>

              {/* Feature Deviations */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Top Contributing Feature Deviations
                </h4>
                <div className="bg-[#131C2E] border border-[#1F2937] rounded-xl p-4 space-y-3 font-mono">
                  {selectedAnomaly.contributing_features &&
                    Object.entries(selectedAnomaly.contributing_features).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-[#1F2937] pb-1.5">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-cyan-400 font-bold">{String(val)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
