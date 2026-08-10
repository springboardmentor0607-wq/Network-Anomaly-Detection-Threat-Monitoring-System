import React, { useState, useEffect } from 'react';
import { Search, X, ShieldAlert, FolderLock, Globe, Terminal, User, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // toggle search modal handled in parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: 'Overview Dashboard', path: '/', icon: <Terminal className="w-4 h-4 text-cyan-400" /> },
    { title: 'Live Network Monitor', path: '/monitoring', icon: <Globe className="w-4 h-4 text-emerald-400" /> },
    { title: 'Network Topology Visualizer', path: '/topology', icon: <Globe className="w-4 h-4 text-purple-400" /> },
    { title: 'Intrusion Prediction', path: '/prediction', icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
    { title: 'Alerts Triage Queue', path: '/alerts', icon: <ShieldAlert className="w-4 h-4 text-red-400" /> },
    { title: 'Incident Response Board', path: '/incidents', icon: <FolderLock className="w-4 h-4 text-blue-400" /> },
    { title: 'Threat Intelligence Feeds', path: '/intelligence', icon: <Globe className="w-4 h-4 text-cyan-400" /> },
    { title: 'AI Model Registry', path: '/models', icon: <FileText className="w-4 h-4 text-cyan-400" /> },
  ];

  const searchResults = query.trim()
    ? [
        { type: 'IP Address', title: `Look up IP: ${query}`, path: `/intelligence?ip=${encodeURIComponent(query)}`, icon: <Globe className="w-4 h-4 text-cyan-400" /> },
        { type: 'Alert', title: `Filter Alerts for "${query}"`, path: `/alerts?search=${encodeURIComponent(query)}`, icon: <ShieldAlert className="w-4 h-4 text-red-400" /> },
        { type: 'Incident', title: `Search Incidents "${query}"`, path: `/incidents?search=${encodeURIComponent(query)}`, icon: <FolderLock className="w-4 h-4 text-amber-400" /> },
      ]
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-[#1F2937] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Input bar */}
        <div className="relative p-4 border-b border-[#1F2937] flex items-center">
          <Search className="w-5 h-5 text-cyan-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search IPs, Alert IDs, Incidents, Threat Categories..."
            className="w-full bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4">
          {query.trim() ? (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Search Results</p>
              <div className="space-y-1">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(res.path)}
                    className="w-full text-left p-3 rounded-xl bg-[#131C2E] hover:bg-[#1E293B] border border-[#1F2937] flex items-center justify-between transition group"
                  >
                    <div className="flex items-center space-x-3">
                      {res.icon}
                      <div>
                        <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition">{res.title}</span>
                        <span className="block text-[10px] text-gray-400">{res.type}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.path)}
                    className="p-3 rounded-xl bg-[#131C2E] hover:bg-[#1E293B] border border-[#1F2937] flex items-center space-x-3 text-left transition group"
                  >
                    {item.icon}
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white transition">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-[#0B0F17] border-t border-[#1F2937] flex items-center justify-between text-[11px] text-gray-500">
          <span>Tip: Use <kbd className="px-1.5 py-0.5 bg-[#1F2937] rounded text-gray-300">Esc</kbd> to close</span>
          <span className="text-cyan-400">NetShield AI SOC Intelligence</span>
        </div>
      </div>
    </div>
  );
};
