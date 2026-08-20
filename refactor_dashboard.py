import sys

file_path = 'e:/NetShield/frontend/src/app/dashboard-cinematic/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
'''  Menu,
  X,
  LogOut
} from "lucide-react";''',
'''  Menu,
  X,
  LogOut,
  Target, Bell, FileText, Network, ClipboardList, UserCircle, ShieldCheck, Cpu, Key, Settings
} from "lucide-react";'''
)

content = content.replace(
'''import AlertFeed from "@/components/AlertFeed";''',
'''import AlertFeed from "@/components/AlertFeed";
import CinematicSidebar, { SidebarTab } from "@/components/dashboards/CinematicSidebar";
import PlaceholderView from "@/components/dashboards/PlaceholderView";'''
)

# 2. State
content = content.replace(
'''  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portData, setPortData] = useState<any[]>(barData);''',
'''  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [portData, setPortData] = useState<any[]>(barData);

  const renderPlaceholder = () => {
    const map: Record<string, { title: string, desc: string, icon: any }> = {
      "live-monitoring": { title: "Live Monitoring", desc: "Real-time network traffic and connected devices stream.", icon: Activity },
      "anomaly-detection": { title: "Anomaly Detection", desc: "View detected anomalies, confidence scores, and AI predictions.", icon: Target },
      "threat-analysis": { title: "Threat Analysis", desc: "Deep dive into incident timelines and related events.", icon: ShieldAlert },
      "alerts": { title: "Alert Management", desc: "Active, acknowledged, and resolved security alerts.", icon: Bell },
      "logs": { title: "Log Management", desc: "Centralized Zeek, network, authentication, and HTTP logs.", icon: FileText },
      "packet-analysis": { title: "Packet Analysis", desc: "View and analyze PCAP files and packet flows.", icon: Network },
      "threat-intelligence": { title: "Threat Intelligence", desc: "Malicious IP lookups, MITRE ATT&CK mapping, and CVE info.", icon: Globe },
      "investigation": { title: "Investigation Workspace", desc: "Add notes, assign status, and gather incident evidence.", icon: Search },
      "reports": { title: "Security Reports", desc: "Daily, weekly, and monthly reports with export options.", icon: ClipboardList },
      "search": { title: "Global Search", desc: "Search across IPs, domains, usernames, and alert IDs.", icon: Search },
      "notifications": { title: "Notifications", desc: "System alerts, critical updates, and investigation status.", icon: Bell },
      "profile": { title: "My Profile", desc: "Manage your account, password, and notification preferences.", icon: UserCircle },
      "user-management": { title: "User Management", desc: "Add, edit, or remove platform users and analysts.", icon: Users },
      "roles": { title: "Roles & Access Management", desc: "Configure RBAC permissions and access controls.", icon: ShieldCheck },
      "machine-learning": { title: "Machine Learning Models", desc: "Upload, retrain, and monitor AI model performance.", icon: Cpu },
      "detection-rules": { title: "Detection Rules", desc: "Manage YARA, Zeek, and custom signature rules.", icon: Key },
      "database": { title: "Database Management", desc: "MongoDB and PostgreSQL status, backups, and restores.", icon: Database },
      "settings": { title: "System Settings", desc: "Configure Zeek, Kafka, SIEM integrations, and API keys.", icon: Settings },
    };
    const data = map[activeTab];
    if (!data) return null;
    return <PlaceholderView title={data.title} description={data.desc} icon={data.icon} />;
  };'''
)

# 3. Layout start
search_layout_start = '''    <div className="min-h-screen w-full bg-black text-white relative font-sans flex flex-col selection:bg-white/20">'''
replace_layout_start = '''    <div className="min-h-screen w-full bg-black text-white relative font-sans flex selection:bg-white/20">'''
content = content.replace(search_layout_start, replace_layout_start)

# 4. Remove Header and Mobile Menu, Insert Sidebar
import re
header_pattern = re.compile(r'\{\/\* Sleek Cinematic Navbar \*\/\}.*?\{\/\* Main Dashboard Content \*\/\}\n', re.DOTALL)
replacement_header = '''{/* Sidebar */}
      <CinematicSidebar 
        role={role as "admin" | "analyst"}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Dashboard Content */}
'''
content = header_pattern.sub(replacement_header, content)

# 5. Update main and add activeTab check
content = content.replace(
'''      <main className="relative z-10 flex-1 p-4 sm:p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto">
        {/* Title Bar */}''',
'''      <main className="relative z-10 flex-1 p-4 sm:p-6 md:p-8 lg:p-12 ml-[280px] w-full h-screen overflow-y-auto">
        {activeTab === "dashboard" ? (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Title Bar */}'''
)

# 6. Close the wrapper for activeTab
content = content.replace(
'''        )}
      </main>''',
'''        )}
          </div>
        ) : (
          renderPlaceholder()
        )}
      </main>'''
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done replacing.')
