"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  API_BASE_URL,
  CurrentUser,
  useAuth,
} from "../lib/auth-context";

type Section =
  | "overview"
  | "monitoring"
  | "anomalies"
  | "alerts"
  | "intelligence"
  | "team";

type AnalyticsSummary = {
  dataset: string;
  total_records: number;
  normal_traffic: number;
  attack_traffic: number;
  attack_percentage: number;
  top_attack_types: Record<string, number>;
  protocol_distribution: Record<string, number>;
};

type AttackAnalytics = {
  dataset: string;
  total_attacks: number;
  attack_categories: {
    attack_category: string;
    count: number;
  }[];
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
};

const navigation = [
  {
    id: "overview" as Section,
    label: "Overview",
    icon: "⌂",
  },
  {
    id: "monitoring" as Section,
    label: "Network Monitoring",
    icon: "◉",
  },
  {
    id: "anomalies" as Section,
    label: "Anomaly Detection",
    icon: "⌁",
  },
  {
    id: "alerts" as Section,
    label: "Alerts",
    icon: "!",
  },
  {
    id: "intelligence" as Section,
    label: "Threat Intelligence",
    icon: "◆",
  },
];

const adminNavigation = {
  id: "team" as Section,
  label: "Team Management",
  icon: "♙",
};

const sectionInfo: Record<
  Section,
  {
    title: string;
    subtitle: string;
  }
> = {
  overview: {
    title: "Security Overview",
    subtitle: "Monitor your network security posture in real time.",
  },
  monitoring: {
    title: "Network Monitoring",
    subtitle: "Monitor network traffic and connected hosts.",
  },
  anomalies: {
    title: "Anomaly Detection",
    subtitle: "Identify unusual patterns and suspicious network behaviour.",
  },
  alerts: {
    title: "Security Alerts",
    subtitle: "Review and manage detected security threats.",
  },
  intelligence: {
    title: "Threat Intelligence",
    subtitle: "Analyse threats, attack patterns, and security risks.",
  },
  team: {
    title: "Team Management",
    subtitle: "Manage registered NetShield AI users.",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  const [activeSection, setActiveSection] =
    useState<Section>("overview");

  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [attackAnalytics, setAttackAnalytics] =
    useState<AttackAnalytics | null>(null);

  const [attackAnalyticsLoading, setAttackAnalyticsLoading] =
    useState(false);

  const [attackAnalyticsError, setAttackAnalyticsError] =
    useState("");
  const [selectedDataset, setSelectedDataset] =
    useState<"UNSW-NB15" | "CIC-IDS2017">("UNSW-NB15");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "security_analyst",
  });
  const handleAddUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/add-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newUser),
    });
  

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Could not add user.");
    }

    alert("User added successfully!");

    setShowAddUser(false);

    setNewUser({
      username: "",
      email: "",
      password: "",
      role: "security_analyst",
    });

    // Reload users
    window.location.reload();

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Failed to add user."
    );
  }
};
const handleDeleteUser = async (id: number) => {
  if (!confirm("Are you sure you want to remove this user?")) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/delete-user/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Could not remove user.");
    }

    alert("User removed successfully!");

    window.location.reload();

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Could not remove user."
    );
  }
};

  // Protect dashboard
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Load users when administrator opens Team Management
  useEffect(() => {
    if (
      activeSection !== "team" ||
      !user ||
      user.role !== "security_administrator"
    ) {
      return;
    }

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError("");

      try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load registered users."
          );
        }

        setUsers(data);
      } catch (error) {
        setUsersError(
          error instanceof Error
            ? error.message
            : "Could not load registered users."
        );
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [activeSection, user, token]);

  // Load dataset analytics
useEffect(() => {
  if (!user || !token) {
    return;
  }

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {
      const endpoint = `${API_BASE_URL}/analytics/summary?dataset=${encodeURIComponent(
        selectedDataset
      )}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load analytics."
        );
      }

      setAnalytics(data);
    } catch (error) {
      setAnalyticsError(
        error instanceof Error
          ? error.message
          : "Could not load analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };
  loadAnalytics();
}, [user, token, selectedDataset]);

// Load attack analytics
useEffect(() => {
  if (!user || !token) {
    return;
  }

  const loadAttackAnalytics = async () => {
    setAttackAnalyticsLoading(true);
    setAttackAnalyticsError("");

    try {
      const endpoint = `${API_BASE_URL}/analytics/attacks?dataset=${encodeURIComponent(
        selectedDataset
      )}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load attack analytics."
        );
      }

      setAttackAnalytics(data);
    } catch (error) {
      setAttackAnalyticsError(
        error instanceof Error
          ? error.message
          : "Could not load attack analytics."
      );
    } finally {
      setAttackAnalyticsLoading(false);
    }
  };

  loadAttackAnalytics();
}, [user, token, selectedDataset]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-[#9ca3af]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#374151] border-t-[#2dd4bf]" />
          <p className="font-mono text-xs uppercase tracking-wider">
            Verifying security session...
          </p>
        </div>
      </main>
    );
  }

  const currentSection = sectionInfo[activeSection];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#e5e7eb]">
      {/* SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r border-[#1f2937] bg-[#0d0f12] md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-[#1f2937] px-6">
          <div>
            <p className="font-mono text-sm font-semibold tracking-[0.2em] text-[#2dd4bf]">
              NETSHIELD AI
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#6b7280]">
              Security Operations
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
            Monitoring
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-[#2dd4bf]/10 text-[#2dd4bf]"
                      : "text-[#9ca3af] hover:bg-[#111827] hover:text-[#e5e7eb]"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-current font-mono text-xs">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {user.role === "security_administrator" && (
            <>
              <p className="mb-3 mt-8 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b7280]">
                Administration
              </p>

              <button
                onClick={() => setActiveSection("team")}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  activeSection === "team"
                    ? "bg-[#2dd4bf]/10 text-[#2dd4bf]"
                    : "text-[#9ca3af] hover:bg-[#111827] hover:text-[#e5e7eb]"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-current font-mono text-xs">
                  {adminNavigation.icon}
                </span>

                <span>{adminNavigation.label}</span>
              </button>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-[#1f2937] p-4">
          <div className="mb-3 rounded-lg bg-[#111827] p-3">
            <p className="truncate text-sm font-medium text-white">
              {user.username}
            </p>

            <p className="mt-1 truncate text-xs text-[#6b7280]">
              {user.email}
            </p>

            <span className="mt-2 inline-flex rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-[#2dd4bf]">
              {user.role === "security_administrator"
                ? "Administrator"
                : "Analyst"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-[#374151] px-3 py-2 text-sm text-[#9ca3af] transition-colors hover:border-red-900/60 hover:bg-red-900/10 hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP BAR */}
        <header className="flex min-h-16 items-center justify-between border-b border-[#1f2937] bg-[#0d0f12] px-6">
          <div>
            <h1 className="text-lg font-semibold text-white">
              {currentSection.title}
            </h1>

            <p className="mt-1 hidden text-xs text-[#6b7280] sm:block">
              {currentSection.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#1f2937] bg-[#111827] px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#2dd4bf]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                System Online
              </span>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#374151] bg-[#111827] font-mono text-xs font-semibold text-[#2dd4bf]">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Welcome */}
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
  <div>
    <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
      Security Operations Centre
    </p>

    <h2 className="mt-2 text-2xl font-semibold text-white">
      Welcome back, {user.username}.
    </h2>

    <p className="mt-2 text-sm text-[#6b7280]">
      Here's your current network security overview.
    </p>
  </div>

  {/* Dataset Selector */}
  <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-4">
    <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
      Active Dataset
    </label>

    <select
      value={selectedDataset}
      onChange={(e) =>
        setSelectedDataset(
          e.target.value as "UNSW-NB15" | "CIC-IDS2017"
        )
      }
      className="rounded-lg border border-[#374151] bg-[#0d0f12] px-4 py-2 text-sm text-white outline-none transition-colors focus:border-[#2dd4bf]"
    >
      <option value="UNSW-NB15">
        UNSW-NB15
      </option>

      <option value="CIC-IDS2017">
        CIC-IDS2017
      </option>
    </select>
  </div>
</div>

                            {/* Analytics Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
                  <p className="text-xs text-[#6b7280]">
                    Total Network Records
                  </p>

                  <p className="mt-4 text-2xl font-semibold text-white">
                    {analyticsLoading
                      ? "..."
                      : analytics?.total_records?.toLocaleString() ?? "0"}
                  </p>

                  <p className="mt-2 text-xs text-[#6b7280]">
                    Analysed from {analytics?.dataset ?? "dataset"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
                  <p className="text-xs text-[#6b7280]">
                    Normal Traffic
                  </p>

                  <p className="mt-4 text-2xl font-semibold text-white">
                    {analyticsLoading
                      ? "..."
                      : analytics?.normal_traffic?.toLocaleString() ?? "0"}
                  </p>

                  <p className="mt-2 text-xs text-[#2dd4bf]">
                    Normal network activity
                  </p>
                </div>

                <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
                  <p className="text-xs text-[#6b7280]">
                    Attack Traffic
                  </p>

                  <p className="mt-4 text-2xl font-semibold text-white">
                    {analyticsLoading
                      ? "..."
                      : analytics?.attack_traffic?.toLocaleString() ?? "0"}
                  </p>

                  <p className="mt-2 text-xs text-[#f87171]">
                    Detected attack records
                  </p>
                </div>

                <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
                  <p className="text-xs text-[#6b7280]">
                    Attack Percentage
                  </p>

                  <p className="mt-4 text-2xl font-semibold text-white">
                    {analyticsLoading
                      ? "..."
                      : analytics
                        ? `${analytics.attack_percentage.toFixed(2)}%`
                        : "0%"}
                  </p>

                  <p className="mt-2 text-xs text-[#6b7280]">
                    Percentage of analysed traffic
                  </p>
                </div>
              </div>

              {/* Analytics Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Normal vs Attack Traffic */}
                <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
                  <h3 className="font-semibold text-white">
                       Traffic Classification
                  </h3>

                  <p className="mt-1 text-xs text-[#6b7280]">
                      Normal traffic compared with detected attack traffic
                  </p>

                <div className="mt-6 h-72">
                  {analytics && (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
              data={[
                {
                  name: "Normal Traffic",
                  value: analytics.normal_traffic,
                },
                {
                  name: "Attack Traffic",
                  value: analytics.attack_traffic,
                },
              ]}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label
            >
              <Cell fill="#2dd4bf" />
              <Cell fill="#f87171" />
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
              </div>


  {/* Attack Types */}
  <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
    <h3 className="font-semibold text-white">
      Top Attack Types
    </h3>

    <p className="mt-1 text-xs text-[#6b7280]">
      Most frequently detected attack categories
    </p>

    <div className="mt-6 h-72">
      {analytics && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={Object.entries(
              analytics.top_attack_types
            ).map(([name, value]) => ({
              name,
              value,
            }))}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="value"
              fill="#2dd4bf"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>

</div>


{/* Protocol Distribution */}
<div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

  <h3 className="font-semibold text-white">
    Network Protocol Distribution
  </h3>

  <p className="mt-1 text-xs text-[#6b7280]">
    Distribution of protocols observed in the {selectedDataset} dataset
  </p>

  <div className="mt-6 h-80">
    {analytics && (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={Object.entries(
            analytics.protocol_distribution
          ).map(([name, value]) => ({
            name,
            value,
          }))}
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
          />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="value"
            fill="#2dd4bf"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>

</div>

              {/* System status */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">
                        Network Security Status
                      </h3>

                      <p className="mt-1 text-xs text-[#6b7280]">
                        Current monitoring environment
                      </p>
                    </div>

                    <span className="rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#2dd4bf]">
                      Operational
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      ["Network Monitoring", "Ready"],
                      ["Traffic Analysis", "Ready"],
                      ["Anomaly Detection", "Active"],
                      ["Threat Intelligence", "Ready"],
                    ].map(([name, status]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between border-b border-[#1f2937] pb-3 last:border-0"
                      >
                        <span className="text-sm text-[#9ca3af]">
                          {name}
                        </span>

                        <span
                          className={`font-mono text-xs ${
                            status === "Ready" || status === "Active"
                              ? "text-[#2dd4bf]"
                              : "text-[#6b7280]"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
                  <h3 className="font-semibold text-white">
                    Account
                  </h3>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-xs text-[#6b7280]">
                        Username
                      </p>

                      <p className="mt-1 text-sm text-white">
                        {user.username}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#6b7280]">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm text-white">
                        {user.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#6b7280]">
                        Access level
                      </p>

                      <p className="mt-1 text-sm text-[#2dd4bf]">
                        {user.role === "security_administrator"
                          ? "Security Administrator"
                          : "Security Analyst"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Getting started */}
              <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
                  NetShield AI
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  Security monitoring is ready.
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6b7280]">
                  Your NetShield AI workspace is configured. Network
                  monitoring and machine-learning detection modules can
                  be connected as the project develops.
                </p>
              </div>
            </div>
          )}

          {/* OTHER SECTIONS */}

{activeSection === "monitoring" && (
  <NetworkMonitoring
    analytics={analytics}
    token={token}
    selectedDataset={selectedDataset}
  />
)}

{activeSection === "anomalies" && (
  <AnomalyDetection
    token={token}
    selectedDataset={selectedDataset}
  />
)}

{activeSection === "alerts" && (
  <SecurityAlerts
    token={token}
    selectedDataset={selectedDataset}
  />
)}

{activeSection === "intelligence" && (
  <ThreatIntelligence
    analytics={analytics}
    attackAnalytics={attackAnalytics}
    attackAnalyticsLoading={attackAnalyticsLoading}
    selectedDataset={selectedDataset}
  />
)}

          {/* TEAM MANAGEMENT */}
          {activeSection === "team" &&
            user.role === "security_administrator" && (
              <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
                    Administration
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Registered Users
                  </h2>

                  <p className="mt-2 text-sm text-[#6b7280]">
                    View accounts registered on the NetShield AI platform.
                  </p>
                </div>

                <div className="mb-4 flex justify-end gap-3">

                  <button
                    onClick={() => setShowAddUser(true)}
                    className="rounded-lg bg-[#2dd4bf] px-4 py-2 text-sm font-medium text-black hover:bg-[#14b8a6]">
                   + Add User
                  </button>

                 <button
                    className="rounded-lg bg-[#900603] px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                    Remove User
                 </button>

                </div>
                {showAddUser && (
  <div className="mb-6 rounded-xl border border-[#1f2937] bg-[#111827] p-6">

    <h3 className="mb-4 text-lg font-semibold text-white">
      Add New User
    </h3>

    <div className="grid gap-4">

      <input
        type="text"
        placeholder="Username"
        value={newUser.username}
        onChange={(e) =>
          setNewUser({ ...newUser, username: e.target.value })
        }
        className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-3 text-white"
      />

      <input
        type="email"
        placeholder="Email"
        value={newUser.email}
        onChange={(e) =>
          setNewUser({ ...newUser, email: e.target.value })
        }
        className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-3 text-white"
      />

      <input
        type="password"
        placeholder="Password"
        value={newUser.password}
        onChange={(e) =>
          setNewUser({ ...newUser, password: e.target.value })
        }
        className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-3 text-white"
      />

      <select
        value={newUser.role}
        onChange={(e) =>
          setNewUser({ ...newUser, role: e.target.value })
        }
        className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-3 text-white"
      >
        <option value="security_analyst">Security Analyst</option>
        <option value="security_administrator">
          Security Administrator
        </option>
      </select>

      <div className="flex gap-3">

        <button
          onClick={handleAddUser}
          className="rounded-lg bg-[#2dd4bf] px-4 py-2 font-medium text-black"
        >
          Create User
        </button>

        <button
          onClick={() => setShowAddUser(false)}
          className="rounded-lg bg-gray-700 px-4 py-2 text-white"
        >
          Cancel
        </button>

      </div>

    </div>

  </div>
)}
                  <div className="overflow-hidden rounded-xl border border-[#1f2937] bg-[#111827]">
                  {usersLoading && (
                    <div className="p-8 text-center">
                      <p className="font-mono text-xs text-[#6b7280]">
                        Loading registered users...
                      </p>
                    </div>
                  )}

                  {usersError && (
                    <div className="p-6">
                      <div className="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
                        {usersError}
                      </div>
                    </div>
                  )}

                  {!usersLoading && !usersError && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#1f2937] bg-[#0d0f12]">
                            <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                              ID
                            </th>

                            <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                              Username
                            </th>

                            <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                              Email
                            </th>

                            <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                              Role
                            </th>
                            <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#6b7280]">
                              Actions
                           </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#1f2937]">
                          {users.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-6 py-10 text-center text-sm text-[#6b7280]"
                              >
                                No registered users found.
                              </td>
                            </tr>
                          ) : (
                            users.map((registeredUser) => (
                              <tr
                                key={registeredUser.id}
                                className="transition-colors hover:bg-[#0d0f12]"
                              >
                                <td className="px-6 py-4 font-mono text-xs text-[#6b7280]">
                                  #{registeredUser.id}
                                </td>

                                <td className="px-6 py-4 font-medium text-white">
                                  {registeredUser.username}
                                </td>

                                <td className="px-6 py-4 text-[#9ca3af]">
                                  {registeredUser.email}
                                </td>

                                <td className="px-6 py-4">
                                  <span className="rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#2dd4bf]">
                                    {registeredUser.role ===
                                    "security_administrator"
                                      ? "Administrator"
                                      : "Analyst"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => handleDeleteUser(registeredUser.id)}
                                    className="rounded-lg bg-[#900603] px-3 py-1 text-sm font-medium text-white hover:bg-red-700">
                                        Remove
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

function NetworkMonitoring({
  analytics,
  token,
  selectedDataset,
}: {
  analytics: AnalyticsSummary | null;
  token: string | null;
  selectedDataset: "UNSW-NB15" | "CIC-IDS2017";
}) {
  const [traffic, setTraffic] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadTraffic = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/monitoring/traffic?dataset=${encodeURIComponent(
             selectedDataset
             )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load network traffic."
          );
        }

        setTraffic(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Could not load network traffic."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTraffic();
  }, [token, selectedDataset]);

  const protocolData = analytics
    ? Object.entries(
        analytics.protocol_distribution
      ).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
          Live Network Analysis
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Network Monitoring
        </h2>

        <p className="mt-2 text-sm text-[#6b7280]">
          Monitor network traffic, protocols, and detected activity.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Total Records
          </p>

          <p className="mt-4 text-2xl font-semibold text-white">
            {analytics?.total_records?.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Normal Traffic
          </p>

          <p className="mt-4 text-2xl font-semibold text-[#2dd4bf]">
            {analytics?.normal_traffic?.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Attack Traffic
          </p>

          <p className="mt-4 text-2xl font-semibold text-[#f87171]">
            {analytics?.attack_traffic?.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Attack Percentage
          </p>

          <p className="mt-4 text-2xl font-semibold text-white">
            {analytics
              ? `${analytics.attack_percentage.toFixed(2)}%`
              : "0%"}
          </p>
        </div>

      </div>

      {/* PROTOCOL CHART */}
      <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

        <h3 className="font-semibold text-white">
          Network Protocol Distribution
        </h3>

        <p className="mt-1 text-xs text-[#6b7280]">
          Protocols observed in the {selectedDataset} dataset.
        </p>

        <div className="mt-6 h-80">
          {protocolData.length > 0 && (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={protocolData}>

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#2dd4bf"
                  radius={[4, 4, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* TRAFFIC TABLE */}
      <div className="overflow-hidden rounded-xl border border-[#1f2937] bg-[#111827]">

        <div className="border-b border-[#1f2937] p-6">
          <h3 className="font-semibold text-white">
            Network Traffic Records
          </h3>

          <p className="mt-1 text-xs text-[#6b7280]">
            Recent records from the {selectedDataset} dataset.
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-[#6b7280]">
              Loading network traffic...
            </p>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead>
                {selectedDataset === "UNSW-NB15" ? (
                  <tr className="border-b border-[#1f2937] bg-[#0d0f12]">
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      ID
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Protocol
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Service
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      State
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Packets
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Attack Type
                    </th>
                  </tr>
                 ) : (
                  <tr className="border-b border-[#1f2937] bg-[#0d0f12]">

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Destination Port
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Flow Duration
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Total Fwd Packets
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Total Backward Packets
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Flow Bytes/s
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Flow Packets/s
                    </th>

                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                      Status
                    </th>

                  </tr>
                )}
               </thead>

              <tbody className="divide-y divide-[#1f2937]">

                {traffic.map((record, index) => {

                  if (selectedDataset === "UNSW-NB15") {

                    const isAttack = Number(record.label) === 1;

                    const totalPackets =
                      (Number(record.spkts) || 0) +
                      (Number(record.dpkts) || 0);

                    return (
                      <tr
                        key={record.id ?? index}
                        className="transition-colors hover:bg-[#0d0f12]"
                      >

                        {/* ID */}
                        <td className="px-6 py-4 font-mono text-xs text-[#6b7280]">
                          #{record.id ?? index + 1}
                        </td>

                        {/* PROTOCOL */}
                        <td className="px-6 py-4 uppercase text-[#e5e7eb]">
                          {record.proto ?? "—"}
                        </td>

                        {/* SERVICE */}
                        <td className="px-6 py-4 text-[#9ca3af]">
                          {record.service ?? "—"}
                        </td>

                        {/* STATE */}
                        <td className="px-6 py-4 font-mono text-xs text-[#9ca3af]">
                          {record.state ?? "—"}
                        </td>

                        {/* DURATION */}
                        <td className="px-6 py-4 font-mono text-xs text-[#9ca3af]">
                          {record.dur != null
                            ? Number(record.dur).toFixed(3)
                            : "—"}
                        </td>

                        {/* PACKETS */}
                        <td className="px-6 py-4 font-mono text-xs text-[#9ca3af]">
                          {totalPackets.toLocaleString()}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                              isAttack
                                ? "border-red-900/50 bg-red-900/20 text-red-300"
                                : "border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf]"
                            }`}
                          >
                            {isAttack ? "Attack" : "Normal"}
                          </span>

                        </td>

                        {/* ATTACK TYPE */}
                        <td className="px-6 py-4 text-[#9ca3af]">
                          {isAttack
                            ? record.attack_cat || "Unknown"
                            : "—"}
                        </td>

                      </tr>
                    );
                  }

                  /* =====================================================
                    CIC-IDS2017
                    ===================================================== */

                  const isAttack =
                    String(record.Label).toUpperCase() !== "BENIGN";

                  return (
                    <tr
                      key={record.id ?? index}
                      className="transition-colors hover:bg-[#0d0f12]"
                    >

                      <td className="px-6 py-4">
                        {record["Destination Port"] ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        {record["Flow Duration"] ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        {record["Total Fwd Packets"] ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        {record["Total Backward Packets"] ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        {record["Flow Bytes/s"] ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        {record["Flow Packets/s"] ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                            isAttack
                              ? "border-red-900/50 bg-red-900/20 text-red-300"
                              : "border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf]"
                          }`}
                        >
                          {record.Label ?? "—"}
                        </span>
                      </td>

                    </tr>
                  );
                })}

</tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

function AnomalyDetection({
  token,
  selectedDataset,
}: {
  token: string | null;
  selectedDataset: "UNSW-NB15" | "CIC-IDS2017";
}) {
  const [data, setData] = useState<{
    total_records: number;
    normal_records: number;
    anomalous_records: number;
    anomaly_percentage: number;
    anomaly_types: Record<string, number>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  type AnomalyResult = {
  success: boolean;
  prediction: string;
  label: number;
  attack_probability: number;
  attack_category: string;
  category_confidence: number;
  risk_score: number;
  risk_level: string;
  risk_report: {
    threat_detected: boolean;
    threat_type: string;
    risk_score: number;
    risk_level: string;
    confidence: number;
    summary: string;
    recommendation: string;
  };
};

const [prediction, setPrediction] =
  useState<AnomalyResult | null>(null);

const [predictionLoading, setPredictionLoading] =
  useState(false);

const [predictionError, setPredictionError] =
  useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadAnomalyData = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/anomalies/summary?dataset=${encodeURIComponent(
            selectedDataset
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.detail ||
              "Could not load anomaly detection data."
          );
        }

        console.log(result);
        setData(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Could not load anomaly detection data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnomalyData();
  }, [token, selectedDataset]);

  const [reportData, setReportData] = useState<{
    success: boolean;
    dataset: string;
    traffic_summary: {
      total_records: number;
      normal_traffic: number;
      attack_traffic: number;
      attack_percentage: number;
    };
    alert_summary: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    attack_categories: Record<string, number>;
    risk_distribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    incident_status: {
      new: number;
      investigating: number;
      resolved: number;
    };
    report_metadata: {
      total_alerts: number;
      generated_at: string;
    };
  } | null>(null);

  const [reportLoading, setReportLoading] =
    useState(false);

  const [reportError, setReportError] =
    useState("");

  const [recordId, setRecordId] = useState("1");

const runPrediction = async () => {
  if (!token) {
    setPredictionError("You must be logged in.");
    return;
  }

  const id = Number(recordId);

  if (!Number.isInteger(id) || id < 0) {
    setPredictionError("Please enter a valid record ID.");
    return;
  }

  setPredictionLoading(true);
  setPredictionError("");
  setPrediction(null);

  try {
    const response = await fetch(
      `${API_BASE_URL}/anomalies/detect-record/${id}?dataset=${encodeURIComponent(
        selectedDataset)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || "Anomaly detection failed."
      );
    }

    setPrediction(result);
  } catch (error) {
    setPredictionError(
      error instanceof Error
        ? error.message
        : "Anomaly detection failed."
    );
  } finally {
    setPredictionLoading(false);
  }
};

  const generateSecurityReport = async () => {
    if (!token) {
      setReportError("You must be logged in.");
      return;
    }

    setReportLoading(true);
    setReportError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/security-summary?dataset=${encodeURIComponent(
          selectedDataset
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            "Could not generate security report."
        );
      }

      setReportData(result);

    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Could not generate security report."
      );
    } finally {
      setReportLoading(false);
    }
  };
  
  const anomalyChartData = data
    ? [
        {
          name: "Normal",
          value: data.normal_records,
        },
        {
          name: "Anomalous",
          value: data.anomalous_records,
        },
      ]
    : [];

  const attackTypeData = data
    ? Object.entries(data.anomaly_types).map(
        ([name, value]) => ({
          name,
          value,
        })
      )
    : [];
  
  const getRiskStyles = (riskLevel: string) => {
  switch (riskLevel.toUpperCase()) {
    case "MEDIUM":
      return {
        text: "text-[#facc15]",
        border: "border-[#facc15]/30",
        bg: "bg-[#facc15]/10",
        bar: "bg-[#facc15]",
      };

    case "HIGH":
      return {
        text: "text-[#fb923c]",
        border: "border-[#fb923c]/30",
        bg: "bg-[#fb923c]/10",
        bar: "bg-[#fb923c]",
      };

    case "CRITICAL":
      return {
        text: "text-[#f87171]",
        border: "border-[#f87171]/30",
        bg: "bg-[#f87171]/10",
        bar: "bg-[#f87171]",
      };

    case "LOW":
    default:
      return {
        text: "text-[#2dd4bf]",
        border: "border-[#2dd4bf]/30",
        bg: "bg-[#2dd4bf]/10",
        bar: "bg-[#2dd4bf]",
      };
  }
};

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
          AI Security Analysis
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Anomaly Detection
        </h2>

        <p className="mt-2 text-sm text-[#6b7280]">
          Analyse network activity and identify suspicious
          traffic patterns.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {/* AI PREDICTION */}
<div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-white">
        AI Intrusion Prediction
      </h3>

      <p className="mt-1 text-xs text-[#6b7280]">
        Run the trained NetShield AI model on network traffic.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
  <span className="rounded-full border border-[#1f2937] bg-[#0d0f12] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
    Dataset: <span className="text-white">{selectedDataset}</span>
  </span>

  <span className="rounded-full border border-[#1f2937] bg-[#0d0f12] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
    Record: <span className="text-white">{recordId}</span>
  </span>

  <span className="rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#2dd4bf]">
    Model: {selectedDataset === "CIC-IDS2017"
  ? "Random Forest"
  : "Balanced Random Forest"}
  </span>
</div>
    </div>

    <div className="flex items-center gap-3">

      {/* RECORD ID */}
      <input
        type="number"
        min="1"
        value={recordId}
        onChange={(e) => setRecordId(e.target.value)}
        className="w-24 rounded-lg border border-[#1f2937] bg-[#0d0f12] px-3 py-2 text-sm text-white outline-none focus:border-[#2dd4bf]"
        placeholder="Record ID"
      />

      {/* RUN BUTTON */}
      <button
        onClick={runPrediction}
        disabled={predictionLoading}
        className="rounded-lg bg-[#2dd4bf] px-4 py-2 text-sm font-semibold text-[#0d0f12] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {predictionLoading
          ? "Analyzing..."
          : "Run AI Detection"}
      </button>

    </div>
  </div>

  {predictionError && (
    <div className="mt-4 rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
      {predictionError}
    </div>
  )}

</div>

{/* AI RESULT */}
{prediction && (() => {
  const riskStyles = getRiskStyles(
    prediction.risk_level
  );

  const attackPercentage =
    prediction.attack_probability * 100;

  return (
    <div className="mt-6 space-y-6">

      {/* RESULT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {/* PREDICTION */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Prediction
          </p>

          <p
            className={`mt-3 text-xl font-semibold ${
              prediction.prediction === "Attack"
                ? "text-[#f87171]"
                : "text-[#2dd4bf]"
            }`}
          >
            {prediction.prediction}
          </p>
        </div>

        {/* ATTACK PROBABILITY */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">

          <p className="text-xs text-[#6b7280]">
            Attack Probability
          </p>

          <p className="mt-3 text-xl font-semibold text-white">
            {attackPercentage.toFixed(2)}%
          </p>

          {/* Progress bar */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1f2937]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                riskStyles.bar
              }`}
              style={{
                width: `${Math.min(
                  attackPercentage,
                  100
                )}%`,
              }}
            />
          </div>

        </div>

        {/* ATTACK CATEGORY */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">

          <p className="text-xs text-[#6b7280]">
            Attack Category
          </p>

          <p
            className={`mt-3 text-xl font-semibold ${
              prediction.attack_category === "Normal"
                ? "text-[#2dd4bf]"
                : "text-[#f87171]"
            }`}
          >
            {prediction.attack_category}
          </p>

        </div>

        {/* CATEGORY CONFIDENCE */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">

          <p className="text-xs text-[#6b7280]">
            Category Confidence
          </p>

          <p className="mt-3 text-xl font-semibold text-white">
            {(prediction.category_confidence * 100).toFixed(2)}%
          </p>

        </div>

        {/* RISK SCORE */}
        <div
          className={`rounded-xl border ${riskStyles.border} ${riskStyles.bg} p-5`}
        >

          <p className="text-xs text-[#6b7280]">
            Risk Score
          </p>

          <p
            className={`mt-3 text-xl font-semibold ${riskStyles.text}`}
          >
            {prediction.risk_score}/100
          </p>

          <span
            className={`mt-2 inline-flex rounded-full border ${riskStyles.border} ${riskStyles.bg} px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${riskStyles.text}`}
          >
            {prediction.risk_level}
          </span>

        </div>

      </div>

    </div>
  );
})()}

{/* AI RISK REPORT */}
{prediction && prediction.risk_report && (() => {
  const riskStyles = getRiskStyles(
    prediction.risk_level
  );

  return (
    <div
      className={`mt-6 rounded-xl border ${riskStyles.border} ${riskStyles.bg} p-6`}
    >

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#6b7280]">
            AI Security Analysis
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            AI Risk Report
          </h3>

          <p className="mt-2 text-sm text-[#9ca3af]">
            {prediction.risk_report.summary}
          </p>
        </div>

        {/* RISK BADGE */}
        <span
          className={`shrink-0 rounded-full border ${riskStyles.border} ${riskStyles.bg} px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider ${riskStyles.text}`}
        >
          {prediction.risk_level}
        </span>

      </div>

      {/* REPORT DETAILS */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* THREAT DETECTED */}
        <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">

          <p className="text-xs text-[#6b7280]">
            Threat Detected
          </p>

          <p
            className={`mt-2 text-sm font-semibold ${
              prediction.risk_report.threat_detected
                ? "text-[#f87171]"
                : "text-[#2dd4bf]"
            }`}
          >
            {prediction.risk_report.threat_detected
              ? "Yes"
              : "No"}
          </p>

        </div>

        {/* THREAT TYPE */}
        <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">

          <p className="text-xs text-[#6b7280]">
            Threat Type
          </p>

          <p
            className={`mt-2 text-sm font-semibold ${
              prediction.risk_report.threat_detected
                ? "text-[#f87171]"
                : "text-[#2dd4bf]"
            }`}
          >
            {prediction.risk_report.threat_type}
          </p>

        </div>

        {/* CONFIDENCE */}
        <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">

          <p className="text-xs text-[#6b7280]">
            Confidence
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {prediction.risk_report.confidence.toFixed(2)}%
          </p>

        </div>

        {/* RISK LEVEL */}
        <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">

          <p className="text-xs text-[#6b7280]">
            Risk Level
          </p>

          <p
            className={`mt-2 text-sm font-semibold ${riskStyles.text}`}
          >
            {prediction.risk_level}
          </p>

        </div>

      </div>

      {/* RECOMMENDATION */}
      <div className="mt-4 rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">

        <p className="text-xs text-[#6b7280]">
          Recommendation
        </p>

        <p className="mt-2 text-sm font-medium text-white">
          {prediction.risk_report.recommendation}
        </p>

      </div>

    </div>
  );
})()}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Analysed Records
          </p>

          <p className="mt-4 text-2xl font-semibold text-white">
            {loading
              ? "..."
              : data?.total_records.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Normal Records
          </p>

          <p className="mt-4 text-2xl font-semibold text-[#2dd4bf]">
            {loading
              ? "..."
              : data?.normal_records.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Anomalous Records
          </p>

          <p className="mt-4 text-2xl font-semibold text-[#f87171]">
            {loading
              ? "..."
              : data?.anomalous_records.toLocaleString() ?? "0"}
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Anomaly Percentage
          </p>

          <p className="mt-4 text-2xl font-semibold text-white">
            {loading
              ? "..."
              : data
                ? `${data.anomaly_percentage.toFixed(2)}%`
                : "0%"}
          </p>
        </div>

      </div>

    

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* NORMAL VS ANOMALOUS */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

          <h3 className="font-semibold text-white">
            Traffic Classification
          </h3>

          <p className="mt-1 text-xs text-[#6b7280]">
            Normal traffic compared with anomalous activity.
          </p>

          <div className="mt-6 h-72">

            {!loading && data && (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={anomalyChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label
                  >
                    <Cell fill="#2dd4bf" />
                    <Cell fill="#f87171" />
                  </Pie>

                  <Tooltip />

                </PieChart>
              </ResponsiveContainer>
            )}

          </div>

        </div>

        {/* ATTACK TYPES */}
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

          <h3 className="font-semibold text-white">
            Detected Anomaly Types
          </h3>

          <p className="mt-1 text-xs text-[#6b7280]">
            Most frequently detected suspicious activity.
          </p>

          <div className="mt-6 h-72">

            {!loading && data && (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={attackTypeData}>

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill="#f87171"
                    radius={[4, 4, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>
            )}

          </div>

        </div>

      </div>

      {/* DETECTION STATUS */}
      <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

        <div className="flex items-center justify-between">

          <div>
            <h3 className="font-semibold text-white">
              Detection Status
            </h3>

            <p className="mt-1 text-xs text-[#6b7280]">
              Current anomaly analysis status.
            </p>
          </div>

          <span className="rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#2dd4bf]">
            Analysis Active
          </span>

        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
            <p className="text-xs text-[#6b7280]">
              Dataset
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              {selectedDataset}
            </p>
          </div>

          <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
            <p className="text-xs text-[#6b7280]">
              Detection Method
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              Traffic Classification
            </p>
          </div>

          <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
            <p className="text-xs text-[#6b7280]">
              Records Analysed
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              {data?.total_records.toLocaleString() ?? "0"}
            </p>
          </div>

        </div>

      </div>
      {/* AI MODEL INFORMATION */}
      <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
            Machine Learning
          </p>

          <h3 className="mt-2 font-semibold text-white">
            NetShield AI Model
          </h3>

          <p className="mt-1 text-xs text-[#6b7280]">
            Network traffic is analyzed using the trained intrusion detection model.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
            <p className="text-xs text-[#6b7280]">
              Model
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              {selectedDataset === "CIC-IDS2017"
          ? "Random Forest"
          : "Balanced Random Forest"}
            </p>
          </div>

          <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
            <p className="text-xs text-[#6b7280]">
              Dataset
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              {selectedDataset}
            </p>
          </div>

          <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
            <p className="text-xs text-[#6b7280]">
              Detection Type
            </p>

            <p className="mt-2 text-sm font-medium text-white">
              Intrusion Detection
            </p>
          </div>

          <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
            <p className="text-xs text-[#6b7280]">
              Model Status
            </p>

            <p className="mt-2 text-sm font-medium text-[#2dd4bf]">
              Active
            </p>
          </div>

        </div>

      </div>

      {/* SECURITY ACTIVITY REPORT */}
      <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
              Security Reporting
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Security Activity Report
            </h3>

            <p className="mt-1 text-xs text-[#6b7280]">
              Consolidated security activity and threat analysis.
            </p>
          </div>

          <button
            onClick={generateSecurityReport}
            disabled={reportLoading}
            className="rounded-lg bg-[#2dd4bf] px-4 py-2 text-sm font-semibold text-[#0d0f12] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reportLoading
              ? "Generating..."
              : "Generate Security Report"}
          </button>

        </div>

        {/* ERROR */}
        {reportError && (
          <div className="mt-4 rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            {reportError}
          </div>
        )}

        {/* REPORT DATA */}
        {reportData && (
          <div className="mt-6 space-y-6">

            {/* REPORT META */}
            <div className="flex flex-wrap gap-2">

              <span className="rounded-full border border-[#1f2937] bg-[#0d0f12] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
                Dataset:
                <span className="ml-1 text-white">
                  {reportData.dataset}
                </span>
              </span>

              <span className="rounded-full border border-[#1f2937] bg-[#0d0f12] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
                Alerts:
                <span className="ml-1 text-white">
                  {reportData.report_metadata.total_alerts}
                </span>
              </span>

              <span className="rounded-full border border-[#1f2937] bg-[#0d0f12] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
                Generated:
                <span className="ml-1 text-white">
                  {new Date(
                    reportData.report_metadata.generated_at
                  ).toLocaleString()}
                </span>
              </span>

            </div>

            {/* TRAFFIC SUMMARY */}
            <div>

              <h4 className="font-semibold text-white">
                Traffic Summary
              </h4>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    Total Records
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {reportData.traffic_summary.total_records.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    Normal Traffic
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#2dd4bf]">
                    {reportData.traffic_summary.normal_traffic.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    Attack Traffic
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#f87171]">
                    {reportData.traffic_summary.attack_traffic.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    Attack Percentage
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {reportData.traffic_summary.attack_percentage.toFixed(2)}%
                  </p>
                </div>

              </div>

            </div>

            {/* ALERT SUMMARY */}
            <div>

              <h4 className="font-semibold text-white">
                Security Alerts
              </h4>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    Total
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {reportData.alert_summary.total}
                  </p>
                </div>

                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs text-[#6b7280]">
                    Critical
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#f87171]">
                    {reportData.alert_summary.critical}
                  </p>
                </div>

                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                  <p className="text-xs text-[#6b7280]">
                    High
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#fb923c]">
                    {reportData.alert_summary.high}
                  </p>
                </div>

                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <p className="text-xs text-[#6b7280]">
                    Medium
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#facc15]">
                    {reportData.alert_summary.medium}
                  </p>
                </div>

                <div className="rounded-lg border border-[#2dd4bf]/20 bg-[#2dd4bf]/5 p-4">
                  <p className="text-xs text-[#6b7280]">
                    Low
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#2dd4bf]">
                    {reportData.alert_summary.low}
                  </p>
                </div>

              </div>

            </div>

            {/* ATTACK CATEGORIES + RISK */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* ATTACK CATEGORIES */}
              <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-5">

                <h4 className="font-semibold text-white">
                  Attack Categories
                </h4>

                <div className="mt-4 space-y-3">

                  {Object.entries(
                    reportData.attack_categories
                  ).length > 0 ? (
                    Object.entries(
                      reportData.attack_categories
                    ).map(([category, count]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-[#9ca3af]">
                          {category}
                        </span>

                        <span className="rounded-full bg-[#f87171]/10 px-2.5 py-1 text-xs font-semibold text-[#f87171]">
                          {count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6b7280]">
                      No attack categories detected.
                    </p>
                  )}

                </div>

              </div>

              {/* RISK DISTRIBUTION */}
              <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-5">

                <h4 className="font-semibold text-white">
                  Risk Distribution
                </h4>

                <div className="mt-4 space-y-3">

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9ca3af]">
                      Critical
                    </span>
                    <span className="text-sm font-semibold text-[#f87171]">
                      {reportData.risk_distribution.critical}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9ca3af]">
                      High
                    </span>
                    <span className="text-sm font-semibold text-[#fb923c]">
                      {reportData.risk_distribution.high}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9ca3af]">
                      Medium
                    </span>
                    <span className="text-sm font-semibold text-[#facc15]">
                      {reportData.risk_distribution.medium}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9ca3af]">
                      Low
                    </span>
                    <span className="text-sm font-semibold text-[#2dd4bf]">
                      {reportData.risk_distribution.low}
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* INCIDENT STATUS */}
            <div>

              <h4 className="font-semibold text-white">
                Incident Status
              </h4>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    New
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#f87171]">
                    {reportData.incident_status.new}
                  </p>
                </div>

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    Investigating
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#facc15]">
                    {reportData.incident_status.investigating}
                  </p>
                </div>

                <div className="rounded-lg border border-[#1f2937] bg-[#0d0f12] p-4">
                  <p className="text-xs text-[#6b7280]">
                    Resolved
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#2dd4bf]">
                    {reportData.incident_status.resolved}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

function SecurityAlerts({
  token,
  selectedDataset,
}: {
  token: string | null;
  selectedDataset: "UNSW-NB15" | "CIC-IDS2017";
}) {
  const [alerts, setAlerts] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingAlertId, setUpdatingAlertId] = useState<number | null>(null);

  const [notifications, setNotifications] = useState<Record<string, any>[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadAlerts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/alerts?dataset=${encodeURIComponent(
             selectedDataset
            )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load security alerts."
          );
        }

        setAlerts(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Could not load security alerts."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [token, selectedDataset]);

  useEffect(() => {
  if (!token) {
    return;
  }

  const loadNotifications = async () => {
    setNotificationsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not load notifications."
        );
      }

      setNotifications(data);
    } catch (error) {
      console.error("Notification loading error:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  loadNotifications();
}, [token]);

  const updateAlertStatus = async (
  alertId: number,
  status: string
) => {
  if (!token) {
    return;
  }

  setUpdatingAlertId(alertId);
  setError("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/alerts/${alertId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Could not update alert status."
      );
    }

    // Update the alert locally
    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: data.status,
            }
          : alert
      )
    );

  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Could not update alert status."
    );
  } finally {
    setUpdatingAlertId(null);
  }
};

const markNotificationRead = async (
  notificationId: number
) => {
  if (!token) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Could not mark notification as read."
      );
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: 1,
            }
          : notification
      )
    );
  } catch (error) {
    console.error("Notification update error:", error);
  }
};

const markNotificationUnread = async (
  notificationId: number
) => {
  if (!token) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/unread`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Could not mark notification as unread."
      );
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: 0,
            }
          : notification
      )
    );
  } catch (error) {
    console.error("Notification update error:", error);
  }
};

  const criticalAlerts = alerts.filter(
    (alert) => alert.risk_level?.toUpperCase() === "CRITICAL"
  ).length;

  const highAlerts = alerts.filter(
    (alert) => alert.risk_level?.toUpperCase() === "HIGH"
  ).length;

  const mediumAlerts = alerts.filter(
    (alert) => alert.risk_level?.toUpperCase() === "MEDIUM"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#f87171]">
          Security Operations
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Security Alerts
        </h2>

        <p className="mt-2 text-sm text-[#6b7280]">
          Review detected threats and prioritise security incidents.
        </p>
      </div>

      {/* ALERT STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Total Alerts
          </p>

          <p className="mt-4 text-2xl font-semibold text-white">
            {loading ? "..." : alerts.length}
          </p>
        </div>

        <div className="rounded-xl border border-red-900/40 bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Critical
          </p>

          <p className="mt-4 text-2xl font-semibold text-[#f87171]">
            {loading ? "..." : criticalAlerts}
          </p>
        </div>

        <div className="rounded-xl border border-orange-900/40 bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            High Risk
          </p>

          <p className="mt-4 text-2xl font-semibold text-orange-300">
            {loading ? "..." : highAlerts}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-900/40 bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Medium Risk
          </p>

          <p className="mt-4 text-2xl font-semibold text-yellow-300">
            {loading ? "..." : mediumAlerts}
          </p>
        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* ALERT TABLE */}
      <div className="overflow-hidden rounded-xl border border-[#1f2937] bg-[#111827]">

        <div className="border-b border-[#1f2937] p-6">
          <h3 className="font-semibold text-white">
            Detected Security Threats
          </h3>

          <p className="mt-1 text-xs text-[#6b7280]">
            Security alerts generated from detected attack traffic.
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-[#6b7280]">
              Loading security alerts...
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead>
                <tr className="border-b border-[#1f2937] bg-[#0d0f12]">

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Alert ID
                  </th>

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Severity
                  </th>

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Attack Type
                  </th>

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Source IP
                  </th>

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Destination IP
                  </th>

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Protocol
                  </th>

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-[#6b7280]">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-[#1f2937]">

                {alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-[#6b7280]"
                    >
                      No security alerts detected.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert, index) => (

                    <tr
                      key={alert.id ?? index}
                      className="transition-colors hover:bg-[#0d0f12]"
                    >

                      <td className="px-6 py-4 font-mono text-xs text-[#6b7280]">
                        #{alert.id ?? index + 1}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                            alert.risk_level?.toUpperCase() === "CRITICAL"
                              ? "border-red-900/50 bg-red-900/20 text-red-300"
                              : alert.risk_level?.toUpperCase() === "HIGH"
                                ? "border-orange-900/50 bg-orange-900/20 text-orange-300"
                                : alert.risk_level?.toUpperCase() === "MEDIUM"
                                  ? "border-yellow-900/50 bg-yellow-900/20 text-yellow-300"
                                  : "border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf]"
                          }`}
                        >
                          {alert.risk_level ?? "Unknown"}
                        </span>

                      </td>

                      <td className="px-6 py-4 font-medium text-white">
                        {alert.attack_category ?? "Unknown"}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-[#9ca3af]">
                        {alert.srcip ?? "—"}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-[#9ca3af]">
                        {alert.dstip ?? "—"}
                      </td>

                      <td className="px-6 py-4 uppercase text-[#e5e7eb]">
                        {alert.proto ?? "—"}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                            alert.status?.toUpperCase() === "RESOLVED"
                              ? "border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#2dd4bf]"
                              : alert.status?.toUpperCase() === "INVESTIGATING"
                                ? "border-yellow-900/50 bg-yellow-900/20 text-yellow-300"
                                : alert.status?.toUpperCase() === "DISMISSED"
                                  ? "border-[#374151] bg-[#1f2937] text-[#9ca3af]"
                                  : "border-red-900/50 bg-red-900/20 text-red-300"
                          }`}
                        >
                          {alert.status ?? "NEW"}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <select
                          value={alert.status ?? "NEW"}
                          disabled={updatingAlertId === alert.id}
                          onChange={(event) =>
                            updateAlertStatus(
                              alert.id,
                              event.target.value
                            )
                          }
                          className="rounded-lg border border-[#374151] bg-[#0d0f12] px-3 py-2 text-xs text-[#e5e7eb] outline-none transition-colors focus:border-[#2dd4bf]"
                        >
                          <option value="NEW">
                            New
                          </option>

                          <option value="INVESTIGATING">
                            Investigating
                          </option>

                          <option value="RESOLVED">
                            Resolved
                          </option>

                          <option value="DISMISSED">
                            Dismissed
                          </option>
                        </select>

                      </td>

                    </tr>

                  ))
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>
      
      {/* SECURITY NOTIFICATIONS */}
      <div className="rounded-xl border border-[#1f2937] bg-[#111827]">

        <div className="border-b border-[#1f2937] p-6">
          <h3 className="font-semibold text-white">
            Security Notifications
          </h3>

          <p className="mt-1 text-xs text-[#6b7280]">
            Notifications generated from security alerts and incidents.
          </p>
        </div>

        {notificationsLoading ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-[#6b7280]">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#6b7280]">
              No security notifications.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1f2937]">

            {notifications.map((notification, index) => (

              <div
                key={notification.id ?? index}
                className={`flex items-center justify-between gap-6 px-6 py-5 transition-colors hover:bg-[#0d0f12] ${
                  notification.is_read
                    ? "opacity-60"
                    : ""
                }`}
              >

                <div className="min-w-0">

                  <div className="flex items-center gap-3">

                    <span
                      className={`h-2 w-2 rounded-full ${
                        notification.is_read
                          ? "bg-[#374151]"
                          : "bg-[#f87171]"
                      }`}
                    />

                    <h4 className="font-medium text-white">
                      {notification.title ?? "Security Notification"}
                    </h4>

                    {!notification.is_read && (
                      <span className="rounded-full border border-red-900/50 bg-red-900/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
                        New
                      </span>
                    )}

                  </div>

                  <p className="mt-2 text-sm text-[#9ca3af]">
                    {notification.message ?? "Security event detected."}
                  </p>

                  <div className="mt-2 flex gap-4 text-[10px] uppercase tracking-wider text-[#6b7280]">

                    <span>
                      Severity: {notification.severity ?? "Unknown"}
                    </span>

                    <span>
                      Alert #{notification.alert_id ?? "—"}
                    </span>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    notification.is_read
                      ? markNotificationUnread(notification.id)
                      : markNotificationRead(notification.id)
                  }
                  className="shrink-0 rounded-lg border border-[#374151] bg-[#0d0f12] px-3 py-2 text-xs text-[#d1d5db] transition-colors hover:border-[#2dd4bf] hover:text-[#2dd4bf]"
                >
                  {notification.is_read ? "Mark as Unread" : "Mark as Read"}
                </button>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}

function ThreatIntelligence({
  analytics,
  attackAnalytics,
  attackAnalyticsLoading,
  selectedDataset,
}: {
  analytics: AnalyticsSummary | null;
  attackAnalytics: any;
  attackAnalyticsLoading: boolean;
  selectedDataset: string;
}) {
  if (!analytics) {
    return (
      <div className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-wider text-[#6b7280]">
          Loading threat intelligence...
        </p>
      </div>
    );
  }

  const attackTypes = Object.entries(
    analytics.top_attack_types
  ).sort((a, b) => b[1] - a[1]);

  const topThreat = attackTypes[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#f87171]">
          Threat Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Threat Intelligence Report
        </h2>

        <p className="mt-2 text-sm text-[#6b7280]">
          Analyse attack patterns, dominant threats, and network security risks.
        </p>
      </div>

      {/* THREAT SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Total Attacks
          </p>

          <p className="mt-4 text-2xl font-semibold text-[#f87171]">
            {analytics.attack_traffic.toLocaleString()}
          </p>

          <p className="mt-2 text-xs text-[#6b7280]">
            Detected attack records
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Attack Rate
          </p>

          <p className="mt-4 text-2xl font-semibold text-white">
            {analytics.attack_percentage.toFixed(2)}%
          </p>

          <p className="mt-2 text-xs text-[#6b7280]">
            Of analysed network traffic
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Top Threat
          </p>

          <p className="mt-4 text-2xl font-semibold text-orange-300">
            {topThreat?.[0] ?? "Unknown"}
          </p>

          <p className="mt-2 text-xs text-[#6b7280]">
            Most frequently detected attack
          </p>
        </div>

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5">
          <p className="text-xs text-[#6b7280]">
            Dataset
          </p>

          <p className="mt-4 text-2xl font-semibold text-[#2dd4bf]">
            {analytics.dataset}
          </p>

          <p className="mt-2 text-xs text-[#6b7280]">
            Active intelligence source
          </p>
        </div>

      </div>

      {/* Attack Risk Analytics */}
<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

  {/* Total Attacks */}
  <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
    <p className="text-xs uppercase tracking-wider text-[#6b7280]">
      Total Detected Attacks
    </p>

    <p className="mt-4 text-3xl font-semibold text-white">
      {attackAnalyticsLoading
        ? "..."
        : attackAnalytics?.total_attacks?.toLocaleString() ?? "0"}
    </p>

    <p className="mt-2 text-xs text-[#6b7280]">
      From {selectedDataset}
    </p>
  </div>

  {/* High Risk */}
  <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
    <p className="text-xs uppercase tracking-wider text-[#6b7280]">
      High Risk Threats
    </p>

    <p className="mt-4 text-3xl font-semibold text-[#f87171]">
      {attackAnalyticsLoading
        ? "..."
        : attackAnalytics?.risk_distribution.HIGH ?? "0"}
    </p>

    <p className="mt-2 text-xs text-[#6b7280]">
      Requires investigation
    </p>
  </div>

  {/* Critical */}
  <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
    <p className="text-xs uppercase tracking-wider text-[#6b7280]">
      Critical Threats
    </p>

    <p className="mt-4 text-3xl font-semibold text-[#ef4444]">
      {attackAnalyticsLoading
        ? "..."
        : attackAnalytics?.risk_distribution.CRITICAL ?? "0"}
    </p>

    <p className="mt-2 text-xs text-[#6b7280]">
      Immediate attention required
    </p>
  </div>

</div>

{/* Attack Risk Distribution */}
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

  {/* Attack Categories */}
  <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
    <h3 className="font-semibold text-white">
      Attack Category Distribution
    </h3>

    <p className="mt-1 text-xs text-[#6b7280]">
      Distribution of detected attack categories
    </p>

    <div className="mt-6 h-72">
      {attackAnalytics && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
  data={attackAnalytics.attack_categories}
  margin={{ top: 25, right: 20, left: 10, bottom: 20 }}
>
  <XAxis
    dataKey="attack_category"
    tick={{ fill: "#ffffff", fontSize: 12 }}
    interval={0}
  />

  <YAxis
    allowDecimals={false}
    ticks={[0, 1, 2]}
    tick={{ fill: "#ffffff", fontSize: 12 }}
  />

  <Tooltip />

  <Bar
    dataKey="count"
    fill="#2dd4bf"
    radius={[4, 4, 0, 0]}
  >
    <LabelList
      dataKey="count"
      position="top"
      fill="#ffffff"
      fontSize={12}
    />
  </Bar>
</BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>

  {/* Risk Distribution */}
  <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">
    <h3 className="font-semibold text-white">
      Risk Distribution
    </h3>

    <p className="mt-1 text-xs text-[#6b7280]">
      Threats grouped by security risk level
    </p>

    <div className="mt-6 h-72">
      {attackAnalytics && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                {
                  name: "Low",
                  value:
                    attackAnalytics.risk_distribution.LOW,
                },
                {
                  name: "Medium",
                  value:
                    attackAnalytics.risk_distribution.MEDIUM,
                },
                {
                  name: "High",
                  value:
                    attackAnalytics.risk_distribution.HIGH,
                },
                {
                  name: "Critical",
                  value:
                    attackAnalytics.risk_distribution.CRITICAL,
                },
              ]}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              <Cell fill="#2dd4bf" />
              <Cell fill="#fbbf24" />
              <Cell fill="#f87171" />
              <Cell fill="#ef4444" />
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>

</div>

      {/* TOP THREATS */}
      <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">
              Top Threat Categories
            </h3>

            <p className="mt-1 text-xs text-[#6b7280]">
              Attack categories ranked by frequency.
            </p>
          </div>

          <span className="rounded-full border border-red-900/40 bg-red-900/20 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-red-300">
            Threat Analysis
          </span>
        </div>

        <div className="mt-6 space-y-4">

          {attackTypes.map(([name, value], index) => {

            const percentage =
              (value / analytics.attack_traffic) * 100;

            return (
              <div key={name}>

                <div className="mb-2 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <span className="font-mono text-xs text-[#6b7280]">
                      #{index + 1}
                    </span>

                    <span className="text-sm font-medium text-white">
                      {name}
                    </span>

                  </div>

                  <span className="font-mono text-xs text-[#9ca3af]">
                    {value.toLocaleString()}
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#1f2937]">

                  <div
                    className="h-full rounded-full bg-[#f87171]"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                    }}
                  />

                </div>

                <p className="mt-1 text-right text-[10px] text-[#6b7280]">
                  {percentage.toFixed(2)}% of attacks
                </p>

              </div>
            );
          })}

        </div>

      </div>

      {/* INTELLIGENCE INSIGHTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

          <h3 className="font-semibold text-white">
            Threat Assessment
          </h3>

          <div className="mt-6 space-y-4">

            <div className="rounded-lg border border-red-900/40 bg-red-900/10 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-red-300">
                High Attack Activity
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                Attack traffic represents{" "}
                <span className="font-semibold text-white">
                  {analytics.attack_percentage.toFixed(2)}%
                </span>{" "}
                of the analysed dataset. This indicates a significant
                volume of potentially malicious network activity.
              </p>

            </div>

            <div className="rounded-lg border border-orange-900/40 bg-orange-900/10 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                Dominant Threat
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                <span className="font-semibold text-white">
                  {topThreat?.[0] ?? "Unknown"}
                </span>{" "}
                is currently the most frequently observed attack category.
                Security teams should prioritise investigation of this threat.
              </p>

            </div>

            <div className="rounded-lg border border-[#2dd4bf]/30 bg-[#2dd4bf]/5 p-4">

              <p className="text-xs font-semibold uppercase tracking-wider text-[#2dd4bf]">
                Intelligence Source
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                Analysis is currently based on the {analytics.dataset} network
                intrusion detection dataset.
              </p>

            </div>

          </div>

        </div>

        {/* PROTOCOL INTELLIGENCE */}

        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

          <h3 className="font-semibold text-white">
            Network Protocol Intelligence
          </h3>

          <p className="mt-1 text-xs text-[#6b7280]">
            Most frequently observed network protocols.
          </p>

          <div className="mt-6 space-y-3">

            {Object.entries(
              analytics.protocol_distribution
            )
              .slice(0, 6)
              .map(([protocol, value]) => (

                <div
                  key={protocol}
                  className="flex items-center justify-between rounded-lg border border-[#1f2937] bg-[#0d0f12] px-4 py-3"
                >

                  <span className="font-mono text-sm uppercase text-[#e5e7eb]">
                    {protocol}
                  </span>

                  <span className="font-mono text-xs text-[#2dd4bf]">
                    {value.toLocaleString()} records
                  </span>

                </div>

              ))}

          </div>

        </div>

      </div>

      {/* REPORT FOOTER */}

      <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
              Intelligence Status
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Threat analysis completed
            </h3>

            <p className="mt-2 text-sm text-[#6b7280]">
              Report generated from {analytics.total_records.toLocaleString()}{" "}
              network records.
            </p>
          </div>

          <div className="rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#2dd4bf]">
            Analysis Ready
          </div>

        </div>

      </div>

    </div>
  );
}

function EmptySection({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center">
      <div className="max-w-lg text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#2dd4bf]">
          {label}
        </p>

        <h2 className="mt-3 text-2xl font-semibold text-white">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
          {description}
        </p>

        <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-[#1f2937] bg-[#111827] px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-[#6b7280]" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">
            Module under development
          </span>
        </div>
      </div>
    </div>
  );
}