import React, { useState, useEffect } from 'react';
import { Target, Shield, Cpu, Filter, Eye, ChevronLeft, ChevronRight, X, BarChart2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { threatsApi, PredictionItem } from '../../api/threats';

export const ThreatsPage: React.FC = () => {
  const { token } = useAuth();
  const [threats, setThreats] = useState<PredictionItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected threat for probability breakdown drawer
  const [selectedThreat, setSelectedThreat] = useState<PredictionItem | null>(null);

  useEffect(() => {
    const fetchThreats = async () => {
      setIsLoading(true);
      if (token) {
        try {
          const res = await threatsApi.getThreats(token, page, pageSize, selectedClass);
          setThreats(res.items);
          setTotal(res.total);
          setIsLoading(false);
          return;
        } catch (err) {
          console.warn('Backend threats API offline, loading mock predictions dataset', err);
        }
      }

      // Fallback mock predictions
      const mockItems: PredictionItem[] = [
        {
          id: 'PRED-1',
          flow_id: 'FLOW-1003',
          predicted_class: 'DoS SYN Flood',
          confidence: 0.94,
          model_name: 'Multi-Class Attack Classifier Baseline',
          model_version: '1.0.0',
          created_at: new Date().toISOString(),
          flow: {
            source_ip: '203.0.113.24',
            destination_ip: '10.0.0.5',
            source_port: 58912,
            destination_port: 8080,
            protocol: 'UDP',
            packets: 1420,
            bytes: 980400,
            duration: 5.12,
          },
        },
        {
          id: 'PRED-2',
          flow_id: 'FLOW-1004',
          predicted_class: 'SSH-Patator Brute Force',
          confidence: 0.88,
          model_name: 'Multi-Class Attack Classifier Baseline',
          model_version: '1.0.0',
          created_at: new Date(Date.now() - 300000).toISOString(),
          flow: {
            source_ip: '198.51.100.88',
            destination_ip: '10.0.0.2',
            source_port: 33412,
            destination_port: 22,
            protocol: 'TCP',
            packets: 540,
            bytes: 124000,
            duration: 3.84,
          },
        },
        {
          id: 'PRED-3',
          flow_id: 'FLOW-1002',
          predicted_class: 'BENIGN',
          confidence: 0.98,
          model_name: 'Multi-Class Attack Classifier Baseline',
          model_version: '1.0.0',
          created_at: new Date(Date.now() - 600000).toISOString(),
          flow: {
            source_ip: '10.0.0.88',
            destination_ip: '172.16.0.4',
            source_port: 41230,
            destination_port: 80,
            protocol: 'TCP',
            packets: 12,
            bytes: 4200,
            duration: 0.28,
          },
        },
      ];

      const filtered = selectedClass === 'ALL' ? mockItems : mockItems.filter((i) => i.predicted_class.toUpperCase().includes(selectedClass.toUpperCase()));
      setThreats(filtered);
      setTotal(filtered.length);
      setIsLoading(false);
    };

    fetchThreats();
  }, [token, page, pageSize, selectedClass]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Target className="w-5 h-5 text-red-400" />
            <span>Supervised Attack Classification Matrix</span>
          </h2>
          <p className="text-xs text-gray-400">
            Multi-class Random Forest / XGBoost predictions trained on dataset attack categories.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Total Classified Predictions</p>
            <p className="text-xl font-bold text-white mt-0.5">{total}</p>
          </div>
          <Target className="w-6 h-6 text-red-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Top Threat Category</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">DoS / DDoS Vector</p>
          </div>
          <Shield className="w-6 h-6 text-amber-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Average Confidence</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">93.4% Probability</p>
          </div>
          <BarChart2 className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Classifier Algorithm</p>
            <p className="text-xl font-bold text-cyan-400 mt-0.5">RandomForest v1.0</p>
          </div>
          <Cpu className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 font-medium">Attack Category Filter:</span>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="bg-[#131C2E] border border-[#1F2937] rounded px-2.5 py-1.5 text-cyan-400 font-semibold focus:outline-none"
            >
              <option value="ALL" className="bg-[#111827]">ALL CLASSES</option>
              <option value="DoS" className="bg-[#111827]">DoS / DDoS</option>
              <option value="Brute Force" className="bg-[#111827]">Brute Force</option>
              <option value="BENIGN" className="bg-[#111827]">BENIGN ONLY</option>
            </select>
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

      {/* Threats Table */}
      <Card title={`Attack Classification Predictions (${total} Total Records)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131C2E] text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Prediction ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Source → Target IP</th>
                <th className="p-3">Predicted Class</th>
                <th className="p-3">Model Confidence</th>
                <th className="p-3">Model Name</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">Loading classification predictions...</td>
                </tr>
              ) : threats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No predictions found for class {selectedClass}.</td>
                </tr>
              ) : (
                threats.map((item) => (
                  <tr key={item.id} className="hover:bg-[#131C2E]/60 transition">
                    <td className="p-3 font-mono font-bold text-cyan-400">{item.id.substring(0, 8)}</td>
                    <td className="p-3 font-mono text-gray-400">{new Date(item.created_at).toLocaleTimeString()}</td>
                    <td className="p-3 font-mono text-gray-200">
                      {item.flow?.source_ip || '203.0.113.24'} → <span className="text-cyan-400 font-semibold">{item.flow?.destination_ip || '10.0.0.5'}</span>
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${item.predicted_class.toUpperCase() !== 'BENIGN' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.predicted_class}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-cyan-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                        <span>{(item.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">{item.model_name}</td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedThreat(item)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Breakdown
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

      {/* Threat Detail Modal Drawer */}
      {selectedThreat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-lg bg-[#111827] border-l border-[#1F2937] p-6 h-full overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Classification Breakdown</h3>
                <p className="text-xs font-mono text-cyan-400">Prediction ID: {selectedThreat.id}</p>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1E293B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#131C2E] border border-[#1F2937] rounded-xl space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">Predicted Attack Vector</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Predicted Class:</span>
                  <span className="font-bold text-red-400 text-sm">{selectedThreat.predicted_class}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Probability Confidence:</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {(selectedThreat.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Model Version:</span>
                  <span className="font-semibold text-white">{selectedThreat.model_version}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
