import React, { useState } from 'react';

const Logs = () => {
  const [logType, setLogType] = useState('All');

  const systemLogs = [
    { id: '10934', time: '19:42:01', source: 'Auth-Service', level: 'WARN', message: 'Failed JWT validation for IP 45.22.19.11' },
    { id: '10935', time: '19:41:15', source: 'FastAPI-Backend', level: 'INFO', message: 'Model v2.4.1 weights reloaded successfully' },
    { id: '10936', time: '19:40:02', source: 'DB-Mongo', level: 'ERROR', message: 'Connection timeout on collection: traffic_events' },
    { id: '10937', time: '19:35:10', source: 'Packet-Sniffer', level: 'INFO', message: 'Ingesting interface eth0 in promiscuous mode' },
    { id: '10938', time: '19:30:00', source: 'System', level: 'INFO', message: 'Automated backup completed (1.2GB)' },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F2F2F0]">System & Event Logs</h2>
          <p className="text-[13px] text-[#9A9A97]">Raw application, database, and infrastructure event stream</p>
        </div>
        <div className="flex gap-2">
          {['All', 'INFO', 'WARN', 'ERROR'].map(level => (
            <button 
              key={level} onClick={() => setLogType(level)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                logType === level ? 'bg-white/[0.1] text-white border border-white/[0.15]' : 'text-[#9A9A97] border border-transparent hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl overflow-hidden flex flex-col font-mono">
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {systemLogs.filter(log => logType === 'All' || log.level === logType).map((log) => (
            <div key={log.id} className="flex gap-4 text-[12px] py-1.5 hover:bg-white/[0.02] px-2 rounded">
              <span className="text-[#9A9A97] w-20 shrink-0">{log.time}</span>
              <span className={`w-12 shrink-0 font-bold ${
                log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'
              }`}>{log.level}</span>
              <span className="text-purple-400 w-32 shrink-0">[{log.source}]</span>
              <span className="text-[#D6D6D3]">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Logs;