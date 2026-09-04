import React, { useEffect, useState } from 'react';
import { socAPI } from '../services/api';
import { ShieldAlert, User, ArrowRight } from 'lucide-react';

const STATE_FLOW = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'];

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newNote, setNewNote] = useState('');

  const fetchIncidents = async () => {
    try {
      const res = await socAPI.getIncidents();
      setIncidents(res.data);
      if (res.data.length > 0 && !selectedIncident) {
        setSelectedIncident(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const transitionStatus = async (target) => {
    try {
      await socAPI.transitionIncident(selectedIncident.id, {
        new_state: target,
        analyst: 'Security Analyst',
        action_note: `Advanced to ${target}`
      });
      const res = await socAPI.getIncidents();
      setIncidents(res.data);
      setSelectedIncident(res.data.find(i => i.id === selectedIncident.id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Transition disallowed');
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await socAPI.addIncidentNote(selectedIncident.id, {
        note: newNote,
        analyst: 'Security Analyst'
      });
      setNewNote('');
      const res = await socAPI.getIncidents();
      setIncidents(res.data);
      setSelectedIncident(res.data.find(i => i.id === selectedIncident.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" /> Incident Management & Strict State Machine
        </h1>
        <p className="text-sm text-slate-400">Strict single-step linear lifecycle enforcement with complete forensic audit trail.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0d1527] border border-[#1b2a4a] p-4 rounded-2xl space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Incident Tickets</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedIncident?.id === inc.id 
                    ? 'bg-cyan-500/10 border-cyan-500 text-white' 
                    : 'bg-[#070b14] border-[#1b2a4a] text-slate-300 hover:bg-[#131f38]'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#00f0ff] font-mono">{inc.incident_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {inc.status}
                  </span>
                </div>
                <h4 className="font-semibold text-sm mt-1">{inc.title}</h4>
              </div>
            ))}
          </div>
        </div>

        {selectedIncident && (
          <div className="lg:col-span-2 bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-[#1b2a4a] pb-4">
              <div>
                <span className="text-xs bg-cyan-500/10 text-[#00f0ff] px-2 py-1 rounded border border-cyan-500/20 font-mono">
                  {selectedIncident.incident_id}
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{selectedIncident.title}</h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400">Assigned Analyst</span>
                <div className="font-bold text-white flex items-center gap-1 mt-1 justify-end">
                  <User className="w-3.5 h-3.5 text-[#00f0ff]" /> {selectedIncident.assigned_analyst}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mandatory State Machine Flow</label>
              <div className="flex flex-wrap gap-2">
                {STATE_FLOW.map((state) => {
                  const isCurrent = selectedIncident.status === state;
                  return (
                    <div 
                      key={state} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        isCurrent 
                          ? 'bg-[#00f0ff] text-[#070b14] border-cyan-400 shadow-lg shadow-cyan-500/20' 
                          : 'bg-[#070b14] text-slate-400 border-[#1b2a4a]'
                      }`}
                    >
                      {state}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                {(() => {
                  const currIdx = STATE_FLOW.indexOf(selectedIncident.status);
                  const nextState = STATE_FLOW[currIdx + 1];
                  if (nextState) {
                    return (
                      <button 
                        onClick={() => transitionStatus(nextState)}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#070b14] px-4 py-2 rounded-xl font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                      >
                        Advance to {nextState} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  }
                  return <span className="text-xs text-slate-500 font-bold">Terminal State Reached (CLOSED)</span>;
                })()}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#1b2a4a]">
              <h3 className="text-sm font-bold text-white">Forensic Audit Trail & Notes</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedIncident.notes?.map((n, idx) => (
                  <div key={idx} className="p-3 bg-[#070b14] border border-[#1b2a4a] rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span className="font-bold text-white">{n.analyst}</span>
                      <span>{n.timestamp}</span>
                    </div>
                    <p className="text-slate-300">{n.note}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={addNote} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add investigation findings..." 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-xl text-xs text-white outline-none"
                />
                <button type="submit" className="bg-[#00f0ff] hover:bg-cyan-400 text-[#070b14] px-4 py-2 rounded-xl text-xs font-bold transition">
                  Add Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
