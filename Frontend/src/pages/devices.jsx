import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const Devices = () => {
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real infrastructure data from FastAPI
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/system/devices');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setDevices(data.devices || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch devices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Surface Tokens
  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl' 
    : 'bg-white/70 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl rounded-2xl';
  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';

  return (
    <div className="space-y-6 transition-colors duration-500">
      <div>
        <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>Infrastructure Monitor</h2>
        <p className={`text-[13px] ${textMuted} mt-0.5`}>Track network endpoints, databases, and monitored assets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            <div className={`col-span-3 py-12 text-center ${textMuted}`}>Scanning network infrastructure...</div>
          ) : devices.length === 0 ? (
            <div className={`col-span-3 py-12 text-center ${textMuted}`}>No active devices detected on the management interface.</div>
          ) : (
            devices.map((device, i) => (
              <motion.div 
                {...fadeInUp} 
                transition={{ delay: i * 0.1 }} 
                key={device.id || i} 
                className={`${cardMaterial} p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${device.status === 'Online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <div className="flex justify-between items-start mb-5 pl-2">
                  <div>
                    <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary}`}>{device.name}</h3>
                    <span className={`text-[12px] font-medium ${textMuted}`}>{device.type}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                    device.status === 'Online' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  }`}>{device.status}</span>
                </div>
                <div className="space-y-3 font-mono text-[12px] pl-2">
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.05] dark:border-black/[0.05]">
                    <span className={textMuted}>IPv4</span>
                    <span className={`font-semibold ${textPrimary}`}>{device.ip}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.05] dark:border-black/[0.05]">
                    <span className={textMuted}>MAC</span>
                    <span className={`font-semibold ${textPrimary}`}>{device.mac}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textMuted}>System Load</span>
                    <span className={`font-semibold ${parseInt(device.load) > 80 ? 'text-red-500' : textPrimary}`}>{device.load}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Devices;