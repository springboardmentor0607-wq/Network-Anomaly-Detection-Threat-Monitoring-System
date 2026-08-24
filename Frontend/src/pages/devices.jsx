import React from 'react';

const Devices = () => {
  const devices = [
    { name: 'Core Gateway', ip: '10.0.0.1', mac: '00:1A:2B:3C:4D:5E', type: 'Router', status: 'Online', load: '42%' },
    { name: 'Auth DB Server', ip: '10.0.1.50', mac: '00:1A:2B:3C:4D:5F', type: 'Postgres', status: 'Online', load: '18%' },
    { name: 'Traffic App DB', ip: '10.0.1.51', mac: '00:1A:2B:3C:4D:60', type: 'MongoDB', status: 'Online', load: '65%' },
    { name: 'Legacy Web', ip: '10.0.2.14', mac: '00:1A:2B:3C:4D:61', type: 'Web Server', status: 'Offline', load: '-' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-[#F2F2F0]">Infrastructure Monitor</h2>
        <p className="text-[13px] text-[#9A9A97]">Track network endpoints, databases, and monitored assets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {devices.map((device, i) => (
          <div key={i} className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-5 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${device.status === 'Online' ? 'bg-emerald-500/50' : 'bg-red-500/50'}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-[15px] font-medium text-[#F2F2F0]">{device.name}</h3>
                <span className="text-[11px] text-[#9A9A97]">{device.type}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>{device.status}</span>
            </div>
            <div className="space-y-2 font-mono text-[12px]">
              <div className="flex justify-between"><span className="text-[#9A9A97]">IPv4</span><span className="text-[#D6D6D3]">{device.ip}</span></div>
              <div className="flex justify-between"><span className="text-[#9A9A97]">MAC</span><span className="text-[#D6D6D3]">{device.mac}</span></div>
              <div className="flex justify-between"><span className="text-[#9A9A97]">System Load</span><span className="text-[#D6D6D3]">{device.load}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Devices;