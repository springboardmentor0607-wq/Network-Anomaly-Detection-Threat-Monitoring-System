import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Globe, Search, ShieldAlert, Target, ExternalLink, CheckCircle } from 'lucide-react';

interface IOC {
  ip: string;
  category: string;
  threatActor: string;
  reputationScore: number;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  observedActivity: string;
  country: string;
  asn: string;
  relatedAlerts: number;
}

export const IntelligencePage: React.FC = () => {
  const [searchIp, setSearchIp] = useState('');
  const [iocs] = useState<IOC[]>([
    {
      ip: '42.112.98.14',
      category: 'Botnet / C2 Node',
      threatActor: 'APT-29 ShadowGroup',
      reputationScore: 98,
      confidence: 0.96,
      firstSeen: '2026-07-15T12:00:00Z',
      lastSeen: '2026-08-10T09:12:00Z',
      observedActivity: 'Active SYN Flooding, Credential Harvesting, Automated SSH Probe',
      country: 'US',
      asn: 'AS16509 Amazon.com',
      relatedAlerts: 48,
    },
    {
      ip: '185.220.101.5',
      category: 'Tor Exit Relay',
      threatActor: 'Unknown Scanner',
      reputationScore: 88,
      confidence: 0.91,
      firstSeen: '2026-06-01T08:30:00Z',
      lastSeen: '2026-08-10T08:45:00Z',
      observedActivity: 'Port Scan (TCP 22, 80, 443, 8080, 5432), Web Vulnerability Probing',
      country: 'DE',
      asn: 'AS200003 Tor Exit',
      relatedAlerts: 32,
    },
    {
      ip: '194.26.29.112',
      category: 'Malware Host',
      threatActor: 'FIN7 Ransomware Affiliate',
      reputationScore: 92,
      confidence: 0.94,
      firstSeen: '2026-08-01T10:15:00Z',
      lastSeen: '2026-08-10T07:20:00Z',
      observedActivity: 'Payload Delivery (`stage2.exe`), Command & Control Pingback',
      country: 'RU',
      asn: 'AS49505 HostProvider',
      relatedAlerts: 19,
    },
    {
      ip: '103.251.140.2',
      category: 'Brute Force Source',
      threatActor: 'Lazarus Subgroup',
      reputationScore: 79,
      confidence: 0.85,
      firstSeen: '2026-07-28T16:00:00Z',
      lastSeen: '2026-08-09T22:10:00Z',
      observedActivity: 'RDP Brute Force, Dictionary Password Attack',
      country: 'CN',
      asn: 'AS4134 China Telecom',
      relatedAlerts: 14,
    },
  ]);

  const filteredIocs = searchIp.trim()
    ? iocs.filter((item) => item.ip.includes(searchIp.trim()) || item.category.toLowerCase().includes(searchIp.toLowerCase()))
    : iocs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Threat Intelligence & IOC Feeds</h2>
          <p className="text-xs text-gray-400">Indicators of Compromise (IOCs), malicious IP reputation, and threat actor profiling.</p>
        </div>
      </div>

      {/* Search Bar & Integration Status Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4 border-[#1F2937]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              placeholder="Search Malicious IP, Threat Actor, or Category..."
              className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </Card>

        <Card className="p-4 border-[#1F2937] flex items-center justify-around text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">AbuseIPDB Feed</span>
              <span className="text-[10px] text-gray-400">Active • 2m ago</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white block">VirusTotal Feed</span>
              <span className="text-[10px] text-gray-400">Active • 5m ago</span>
            </div>
          </div>
        </Card>
      </div>

      {/* IOC Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredIocs.map((ioc) => (
          <Card key={ioc.ip} className="p-5 border-[#1F2937] hover:border-cyan-500/30 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-red-950/70 border border-red-500/30 rounded-xl text-red-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{ioc.ip}</h3>
                    <span className="text-xs text-gray-400">{ioc.country} • {ioc.asn}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Threat Score</span>
                  <span className="text-lg font-bold text-red-400">{ioc.reputationScore}/100</span>
                </div>
              </div>

              <div className="p-3 bg-[#0B0F17] border border-[#1F2937] rounded-xl text-xs space-y-2">
                <div className="flex justify-between"><span className="text-gray-400">Category:</span><span className="font-bold text-white">{ioc.category}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Threat Actor:</span><span className="font-semibold text-cyan-400">{ioc.threatActor}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Observed Activity:</span><span className="text-gray-200 text-right max-w-xs">{ioc.observedActivity}</span></div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-[#1F2937]">
                <span>Related Alerts: <strong className="text-cyan-400">{ioc.relatedAlerts} Events</strong></span>
                <span>Confidence: <strong className="text-emerald-400">{(ioc.confidence * 100).toFixed(0)}%</strong></span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
