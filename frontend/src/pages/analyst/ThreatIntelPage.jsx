import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import {
  GlobeAltIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ThreatIntelPage = () => {
  const [overview, setOverview] = useState(null);
  const [intelList, setIntelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [threatLevelFilter, setThreatLevelFilter] = useState('');

  // Selected Detail Item Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [enriching, setEnriching] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/threat-intelligence/overview');
      if (res.data && res.data.data) {
        setOverview(res.data.data);
      }
    } catch (e) {}
  };

  const fetchIntelList = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (threatLevelFilter) params.threatLevel = threatLevelFilter;

      const res = await api.get('/threat-intelligence/reports', { params });
      if (res.data && res.data.data) {
        setIntelList(res.data.data.data || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching threat intel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchIntelList();
  }, [page, typeFilter, threatLevelFilter]);

  const handleEnrich = async (intelId) => {
    setEnriching(true);
    try {
      const res = await api.post(`/threat-intelligence/${intelId}/enrich`);
      alert('Indicator enriched successfully via External Threat Intelligence Provider!');
      setSelectedItem(res.data.data);
      fetchOverview();
      fetchIntelList();
    } catch (err) {
      alert(err.response?.data?.error || 'Enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide font-mono flex items-center space-x-3">
            <GlobeAltIcon className="w-6 h-6 text-cyan-400" />
            <span>SOC Threat Intelligence Subsystem</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Observed internal packet telemetry correlated with external threat intelligence providers (AbuseIPDB, VirusTotal, AlienVault OTX).
          </p>
        </div>
        <button
          onClick={() => { fetchOverview(); fetchIntelList(); }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs flex items-center space-x-2 border border-slate-700"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono">
        <Card title="Total Indicators" value={overview?.summary?.totalIndicators || 0} icon={GlobeAltIcon} glowColor="cyan" />
        <Card title="Internal Observed" value={overview?.summary?.internalObserved || 0} icon={ShieldCheckIcon} glowColor="cyan" />
        <Card title="External Enriched" value={overview?.summary?.externalEnriched || 0} icon={SparklesIcon} glowColor="orange" />
        <Card title="Critical Indicators" value={overview?.summary?.criticalCount || 0} icon={ExclamationCircleIcon} glowColor="red" />
        <Card title="High Level Threats" value={overview?.summary?.highCount || 0} icon={ExclamationCircleIcon} glowColor="orange" />
      </div>

      {/* Top Observed Malicious Source IPs */}
      {overview?.topObservedSources && overview.topObservedSources.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-cyan-400">
            🔥 Top Observed Internal Threat Telemetry Sources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {overview.topObservedSources.map((src) => (
              <div key={src.sourceIp} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="font-bold text-cyan-300 block">{src.sourceIp}</span>
                <span className="text-slate-400 text-[10px] block">Occurrences: <strong className="text-white">{src.occurrenceCount}</strong></span>
                <span className="text-slate-400 text-[10px] block">Max Risk: <strong className="text-rose-400">{src.maxRiskScore}/100</strong></span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {src.attackTypes.map(at => (
                    <span key={at} className="px-1.5 py-0.5 bg-slate-900 text-slate-300 text-[9px] rounded font-bold border border-slate-800">
                      {at}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search IP, Domain, Malware Family, Category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="IP">IP Address</option>
            <option value="DOMAIN">Domain</option>
            <option value="HASH">Hash</option>
            <option value="MALWARE_FAMILY">Malware Family</option>
          </select>

          <select
            value={threatLevelFilter}
            onChange={(e) => { setThreatLevelFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
          >
            <option value="">All Threat Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Indicator Feed Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 font-mono text-xs">
        {loading ? (
          <Skeleton height="h-64" />
        ) : intelList.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No threat intelligence indicators found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-3">Indicator</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Threat Level</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Enrichment Source</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {intelList.map((item) => (
                  <tr key={item.intelId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">{item.indicatorValue}</td>
                    <td className="py-3 px-3 text-slate-300">{item.type}</td>
                    <td className="py-3 px-3">
                      <Badge variant={item.threatLevel?.toLowerCase()}>{item.threatLevel}</Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-200">{item.category}</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">{item.confidence}%</td>
                    <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate">
                      {item.isExternalEnriched ? (
                        <span className="text-orange-400 font-bold flex items-center space-x-1">
                          <SparklesIcon className="w-3.5 h-3.5" />
                          <span>External Enriched</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Internal Observed</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold border border-slate-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Inspection & External Provider Enrichment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-2xl border border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-cyan-400 font-bold text-xs">{selectedItem.intelId}</span>
                <h3 className="text-base font-bold text-white font-sans">{selectedItem.indicatorValue}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">INDICATOR TYPE:</span>
                <span className="text-white font-bold">{selectedItem.type} ({selectedItem.category})</span>
                <span className="text-slate-500 text-[10px] block mt-2">THREAT LEVEL & CONFIDENCE:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedItem.threatLevel?.toLowerCase()}>{selectedItem.threatLevel}</Badge>
                  <span className="text-emerald-400 font-bold">{selectedItem.confidence}% Confidence</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">SOURCE ATTRIBUTION:</span>
                <span className="text-cyan-300 font-bold leading-tight block">{selectedItem.source}</span>
                <span className="text-slate-500 text-[10px] block mt-2">TARGET INDUSTRIES:</span>
                <span className="text-slate-300 block">{selectedItem.targetIndustries?.join(', ') || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">DESCRIPTION:</span>
              <p className="text-slate-200">{selectedItem.description}</p>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-1">
              <span className="text-emerald-300 font-bold block">MITIGATION ADVISORY:</span>
              <p className="text-slate-200">{selectedItem.mitigation}</p>
            </div>

            {/* External Enrichment Status */}
            {selectedItem.rawTelemetryStats?.externalEnrichment && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-orange-400 font-bold flex items-center space-x-2">
                  <SparklesIcon className="w-4 h-4" />
                  <span>EXTERNAL ENRICHMENT DATA:</span>
                </span>
                <pre className="text-[10px] text-cyan-300 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">
                  {JSON.stringify(selectedItem.rawTelemetryStats.externalEnrichment, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {!selectedItem.isExternalEnriched ? (
                <button
                  disabled={enriching}
                  onClick={() => handleEnrich(selectedItem.intelId)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-black font-extrabold rounded-xl flex items-center space-x-2 shadow-glow-cyan"
                >
                  <SparklesIcon className="w-4 h-4 stroke-[3]" />
                  <span>{enriching ? 'Enriching via Provider...' : 'Enrich via External Provider'}</span>
                </button>
              ) : (
                <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Enriched via External Provider</span>
                </span>
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-800"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatIntelPage;
