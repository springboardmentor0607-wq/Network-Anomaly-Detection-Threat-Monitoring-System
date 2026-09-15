import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Globe, Shield, Server, Database, Monitor, Cloud, Terminal, Radio, AlertTriangle } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  type: string;
  ip: string;
  x: number;
  y: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  icon: React.ReactNode;
}

interface Edge {
  from: string;
  to: string;
  protocol: string;
  status: 'NORMAL' | 'SUSPICIOUS' | 'ATTACK';
  packetsPerSec: number;
}

export const TopologyPage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const nodes: Node[] = [
    { id: 'internet', name: 'Internet / WAN', type: 'External', ip: '0.0.0.0/0', x: 80, y: 220, status: 'WARNING', icon: <Globe className="w-6 h-6 text-blue-400" /> },
    { id: 'gateway', name: 'Edge Gateway Router', type: 'Gateway', ip: '192.168.1.1', x: 250, y: 220, status: 'SAFE', icon: <Radio className="w-6 h-6 text-cyan-400" /> },
    { id: 'firewall', name: 'Next-Gen Firewall', type: 'Security', ip: '192.168.1.254', x: 420, y: 220, status: 'SAFE', icon: <Shield className="w-6 h-6 text-emerald-400" /> },
    { id: 'webserver', name: 'Primary Web Gateway', type: 'Server', ip: '192.168.1.100', x: 600, y: 110, status: 'CRITICAL', icon: <Server className="w-6 h-6 text-red-400" /> },
    { id: 'authserver', name: 'Auth & LDAP Cluster', type: 'Server', ip: '192.168.1.105', x: 600, y: 220, status: 'WARNING', icon: <Server className="w-6 h-6 text-amber-400" /> },
    { id: 'database', name: 'PostgreSQL DB Cluster', type: 'Database', ip: '192.168.1.250', x: 780, y: 160, status: 'WARNING', icon: <Database className="w-6 h-6 text-amber-400" /> },
    { id: 'cloud', name: 'AWS Cloud Backup', type: 'Cloud', ip: '10.0.0.4', x: 600, y: 330, status: 'SAFE', icon: <Cloud className="w-6 h-6 text-purple-400" /> },
    { id: 'workstations', name: 'Internal Workstations', type: 'Endpoint', ip: '192.168.1.0/24', x: 420, y: 360, status: 'SAFE', icon: <Monitor className="w-6 h-6 text-gray-300" /> },
    { id: 'soc', name: 'NetShield SOC Console', type: 'SOC', ip: '192.168.1.15', x: 250, y: 360, status: 'SAFE', icon: <Terminal className="w-6 h-6 text-cyan-400" /> },
  ];

  const edges: Edge[] = [
    { from: 'internet', to: 'gateway', protocol: 'HTTPS / TCP', status: 'ATTACK', packetsPerSec: 4200 },
    { from: 'gateway', to: 'firewall', protocol: 'TCP', status: 'SUSPICIOUS', packetsPerSec: 2800 },
    { from: 'firewall', to: 'webserver', protocol: 'HTTP 8080', status: 'ATTACK', packetsPerSec: 3400 },
    { from: 'firewall', to: 'authserver', protocol: 'HTTPS 443', status: 'SUSPICIOUS', packetsPerSec: 650 },
    { from: 'webserver', to: 'database', protocol: 'PostgreSQL 5432', status: 'SUSPICIOUS', packetsPerSec: 920 },
    { from: 'authserver', to: 'database', protocol: 'SQL', status: 'NORMAL', packetsPerSec: 120 },
    { from: 'firewall', to: 'cloud', protocol: 'TLS 443', status: 'NORMAL', packetsPerSec: 310 },
    { from: 'firewall', to: 'workstations', protocol: 'DNS 53', status: 'NORMAL', packetsPerSec: 450 },
    { from: 'soc', to: 'firewall', protocol: 'SSH / SNMP', status: 'NORMAL', packetsPerSec: 45 },
  ];

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interactive Network Topology</h2>
          <p className="text-xs text-gray-400">Real-time node status, traffic links, and malicious path highlighting.</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-gray-300">Normal</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-gray-300">Suspicious</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><span className="text-gray-300">Active Attack</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Network Canvas */}
        <div className="lg:col-span-3">
          <Card className="relative overflow-hidden min-h-[500px]">
            <svg className="w-full h-[480px] bg-[#070A11] rounded-xl border border-[#1F2937]">
              {/* Grid Background */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(31, 41, 55, 0.4)" strokeWidth="1" />
                </pattern>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Edge Connections */}
              {edges.map((edge, idx) => {
                const n1 = getNode(edge.from);
                const n2 = getNode(edge.to);
                if (!n1 || !n2) return null;
                const isAttack = edge.status === 'ATTACK';
                const isSuspicious = edge.status === 'SUSPICIOUS';

                return (
                  <g key={idx}>
                    <line
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      stroke={isAttack ? '#EF4444' : isSuspicious ? '#F59E0B' : '#10B981'}
                      strokeWidth={isAttack ? 3 : isSuspicious ? 2 : 1.5}
                      strokeDasharray={isAttack ? '6 3' : 'none'}
                      filter={isAttack ? 'url(#glow-red)' : undefined}
                      className={isAttack ? 'animate-pulse' : ''}
                    />
                    <circle
                      cx={(n1.x + n2.x) / 2}
                      cy={(n1.y + n2.y) / 2}
                      r="4"
                      fill={isAttack ? '#EF4444' : isSuspicious ? '#F59E0B' : '#38BDF8'}
                    />
                  </g>
                );
              })}

              {/* Network Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    <circle
                      r="24"
                      fill="#0F172A"
                      stroke={node.status === 'CRITICAL' ? '#EF4444' : node.status === 'WARNING' ? '#F59E0B' : '#10B981'}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition duration-200 group-hover:scale-110"
                    />
                    <foreignObject x="-12" y="-12" width="24" height="24">
                      <div className="flex items-center justify-center w-full h-full text-white">
                        {node.icon}
                      </div>
                    </foreignObject>
                    <text
                      y="38"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="11"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {node.name}
                    </text>
                    <text
                      y="50"
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                      className="pointer-events-none select-none"
                    >
                      {node.ip}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Card>
        </div>

        {/* Selected Node Details Drawer */}
        <div className="space-y-4">
          <Card title="Node Forensics">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-[#131C2E] border border-[#1F2937] rounded-xl">
                  {selectedNode.icon}
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedNode.name}</h4>
                    <p className="text-xs text-gray-400">{selectedNode.ip}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#1F2937]"><span className="text-gray-400">Node Type</span><span className="text-white font-medium">{selectedNode.type}</span></div>
                  <div className="flex justify-between py-1 border-b border-[#1F2937]">
                    <span className="text-gray-400">Security State</span>
                    <span className={`font-bold ${selectedNode.status === 'CRITICAL' ? 'text-red-400' : selectedNode.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1F2937]"><span className="text-gray-400">Active Links</span><span className="text-white">3 Connections</span></div>
                </div>

                <div className="pt-2">
                  <h5 className="text-xs font-bold text-gray-300 mb-2">Connected Link Telemetry</h5>
                  <div className="space-y-1.5">
                    {edges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id).map((e, idx) => (
                      <div key={idx} className="p-2 bg-[#0B0F17] rounded-lg border border-[#1F2937] text-[11px] flex justify-between">
                        <span>{e.protocol}</span>
                        <span className={e.status === 'ATTACK' ? 'text-red-400 font-bold' : 'text-emerald-400'}>{e.packetsPerSec} pkts/s</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Click any network node on the map to inspect live connection telemetry and risk status.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
