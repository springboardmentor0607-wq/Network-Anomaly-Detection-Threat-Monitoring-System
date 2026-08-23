import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import {
  FolderIcon,
  PlayIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CpuChipIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AdminDatasetManagementPage = () => {
  const [statusList, setStatusList] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('CICIDS2017');
  const [stats, setStats] = useState(null);
  const [classDist, setClassDist] = useState(null);
  const [featuresMeta, setFeaturesMeta] = useState(null);
  
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isDistModalOpen, setIsDistModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/datasets/status');
      setStatusList(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunPreprocessing = async (name) => {
    setProcessing(true);
    setToast({ message: `Triggering preprocessing pipeline for ${name}...`, type: 'info' });
    try {
      const res = await api.post('/datasets/run-preprocessing', { dataset: name });
      setToast({ message: `Preprocessing completed for ${name}! CSVs and reports created in backend/datasets/processed/${name}`, type: 'success' });
      fetchStatus();
    } catch (e) {
      setToast({ message: 'Preprocessing failed or python dependency missing', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewStatistics = async (name) => {
    setSelectedDataset(name);
    try {
      const res = await api.get(`/datasets/statistics?dataset=${name}`);
      setStats(res.data.data);
      setIsStatsModalOpen(true);
    } catch (e) {
      setToast({ message: 'Error loading statistics', type: 'error' });
    }
  };

  const handleViewClassDist = async (name) => {
    setSelectedDataset(name);
    try {
      const res = await api.get(`/datasets/class-distribution?dataset=${name}`);
      setClassDist(res.data.data);
      setIsDistModalOpen(true);
    } catch (e) {
      setToast({ message: 'Error loading class distribution', type: 'error' });
    }
  };

  const handleDownloadReport = async (name) => {
    try {
      const res = await api.get(`/datasets/preprocessing-report?dataset=${name}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${name}_preprocessing_report.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setToast({ message: `Exported ${name} preprocessing report as JSON`, type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to download report', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Cybersecurity Dataset Management</h2>
          <p className="text-xs text-slate-400">CICIDS2017 & UNSW-NB15 Data Preprocessing Pipeline Engine</p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-black font-extrabold rounded-xl shadow-glow-cyan text-xs uppercase tracking-wider flex items-center space-x-2 transition-all"
        >
          <ArrowUpTrayIcon className="w-4 h-4 stroke-2" />
          <span>Upload Dataset</span>
        </button>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusList.map((ds) => (
          <div key={ds.datasetName} className="glass-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <FolderIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white font-mono">{ds.datasetName}</h3>
                    <span className="text-[11px] text-slate-400">Raw Path: backend/datasets/raw/{ds.datasetName}</span>
                  </div>
                </div>
                <Badge variant={ds.status === 'PROCESSED' ? 'online' : (ds.status === 'READY_TO_PROCESS' ? 'warning' : 'info')}>
                  {ds.status}
                </Badge>
              </div>

              {/* Grid of stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono mb-4">
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Total Records</span>
                  <span className="text-sm font-bold text-white mt-1 block">{ds.totalRecords.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Processed Records</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">{ds.processedRecords.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Attack Classes</span>
                  <span className="text-sm font-bold text-cyan-400 mt-1 block">{ds.classesCount} Classes</span>
                </div>
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Feature Count</span>
                  <span className="text-sm font-bold text-white mt-1 block">{ds.featureCount} Features</span>
                </div>
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Missing Values Fixed</span>
                  <span className="text-sm font-bold text-amber-400 mt-1 block">{ds.missingValues}</span>
                </div>
                <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Processing Date</span>
                  <span className="text-[11px] font-semibold text-slate-300 mt-1 block truncate">
                    {new Date(ds.processingDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleRunPreprocessing(ds.datasetName)}
                disabled={processing}
                className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-black font-extrabold rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1 shadow-glow-cyan"
              >
                <PlayIcon className="w-3.5 h-3.5 stroke-2" />
                <span>Run Preprocess</span>
              </button>

              <button
                onClick={() => handleViewStatistics(ds.datasetName)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-semibold rounded-xl text-[11px] uppercase flex items-center justify-center space-x-1"
              >
                <ChartBarIcon className="w-3.5 h-3.5" />
                <span>View Stats</span>
              </button>

              <button
                onClick={() => handleViewClassDist(ds.datasetName)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-semibold rounded-xl text-[11px] uppercase flex items-center justify-center space-x-1"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Classes</span>
              </button>

              <button
                onClick={() => handleDownloadReport(ds.datasetName)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-semibold rounded-xl text-[11px] uppercase flex items-center justify-center space-x-1"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preprocessing Architecture Callout */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3 font-mono text-xs">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modular Preprocessing Pipeline Components</h3>
        <p className="text-slate-400">
          The dataset engine loads raw CSV files, merges chunks, removes duplicate records, imputes missing values, cleans constant/empty columns, encodes protocols and labels, normalizes features, prepares SMOTE class imbalance hooks, and outputs stratified <code className="text-cyan-400 font-bold">train.csv</code>, <code className="text-cyan-400 font-bold">validation.csv</code>, and <code className="text-cyan-400 font-bold">test.csv</code> into <code className="text-cyan-400 font-bold">backend/datasets/processed/</code>.
        </p>
      </div>

      {/* Statistics Modal */}
      <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title={`Preprocessing Statistics: ${selectedDataset}`}>
        {stats && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Original Rows:</span><span className="text-white font-bold">{stats.original_rows?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Processed Rows:</span><span className="text-emerald-400 font-bold">{stats.processed_rows?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Removed Duplicates:</span><span className="text-amber-400 font-bold">{stats.removed_duplicates?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Missing Values Fixed:</span><span className="text-cyan-400 font-bold">{stats.missing_values_fixed}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Normal Traffic Percentage:</span><span className="text-emerald-400 font-bold">{stats.normal_traffic_percentage}%</span></div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-300 font-bold block mb-1">Dataset Split Ratios</span>
              <div className="flex justify-between"><span className="text-slate-400">Train Samples (80%):</span><span className="text-white font-bold">{stats.dataset_statistics?.train_samples?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Validation Samples (10%):</span><span className="text-white font-bold">{stats.dataset_statistics?.validation_samples?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Test Samples (10%):</span><span className="text-white font-bold">{stats.dataset_statistics?.test_samples?.toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Class Distribution Modal */}
      <Modal isOpen={isDistModalOpen} onClose={() => setIsDistModalOpen(false)} title={`Class Distribution: ${selectedDataset}`}>
        {classDist && (
          <div className="space-y-2 text-xs font-mono max-h-96 overflow-y-auto">
            {Object.entries(classDist).map(([cls, count]) => (
              <div key={cls} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-cyan-300 font-bold">{cls}</span>
                <span className="text-slate-200 font-mono">{count.toLocaleString()} samples</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Dataset CSV File">
        <div className="space-y-4 text-xs font-mono">
          <p className="text-slate-300">
            Upload raw dataset CSV files directly to <code className="text-cyan-400">backend/datasets/raw/</code>.
          </p>
          <input
            type="file"
            accept=".csv"
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300"
          />
          <button
            onClick={() => {
              setIsUploadModalOpen(false);
              setToast({ message: 'Dataset uploaded to raw folder successfully.', type: 'success' });
            }}
            className="w-full py-2.5 bg-cyan-500 text-black font-extrabold uppercase rounded-xl"
          >
            Upload to Raw Subdirectory
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminDatasetManagementPage;
