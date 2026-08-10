# UI/UX & Design System Specifications
## NetShield AI: Network Anomaly Detection & Threat Monitoring System

---

### 1. Visual Direction & Aesthetics

NetShield AI uses a modern **Dark SOC (Security Operations Center)** visual design system. The interface is clean, technical, high-density, and enterprise-ready, designed specifically for long operational shifts in security operations centers.

#### Key Visual Principles
- **Dark-First Palette:** Deep navy/slate backgrounds (`#0B0F17`) to reduce eye strain, paired with dark elevated card surfaces (`#111827`) and subtle structural borders (`#1F2937`).
- **Purposeful Color Accents:**
  - **Primary & Navigation:** Cyan (`#06B6D4`) & Electric Blue (`#3B82F6`).
  - **Healthy / Normal:** Emerald Green (`#10B981`).
  - **Warning / Medium Risk:** Amber / Gold (`#F59E0B`).
  - **Critical / Threat / High Risk:** Crimson Red (`#EF4444`).
  - **AI / Intelligence:** Royal Purple (`#A855F7`).
- **Restrained Effects:** No heavy, distracting glassmorphism, glowing halos, or particle animations. Clean borders, subtle hover state transitions, and precise typography hierarchy.

---

### 2. Design Tokens Matrix

```css
:root {
  /* Color Palette - Surfaces */
  --bg-base: #0B0F17;              /* Deep Navy Dark Base */
  --bg-surface: #111827;           /* Card / Panel Background */
  --bg-surface-elevated: #1F2937;  /* Hover / Modal Surface */
  --bg-surface-subtle: #131C2E;    /* Subtle inset contrast */

  /* Structural Borders */
  --border-subtle: #1F2937;
  --border-default: #374151;
  --border-strong: #4B5563;
  --border-accent: #06B6D4;

  /* Typography Colors */
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --text-inverse: #111827;

  /* Brand & Accents */
  --accent-cyan: #06B6D4;
  --accent-blue: #3B82F6;
  --accent-indigo: #6366F1;
  --accent-purple: #A855F7;

  /* Status & Severity Tokens */
  --status-low: #10B981;          /* Emerald Green (0-29 Low) */
  --status-medium: #F59E0B;       /* Amber (30-59 Medium) */
  --status-high: #F97316;         /* Orange (60-79 High) */
  --status-critical: #EF4444;     /* Red (80-100 Critical) */
  --status-info: #3B82F6;         /* Blue Informational */

  /* Typography Scale */
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;       /* 12px Labels / Captions */
  --font-size-sm: 0.875rem;      /* 14px Body Small / Table Cells */
  --font-size-md: 1.000rem;      /* 16px Body Default / Inputs */
  --font-size-lg: 1.125rem;      /* 18px Card Titles */
  --font-size-xl: 1.500rem;      /* 24px Page Titles (H2) */
  --font-size-2xl: 2.000rem;     /* 32px Stat Counters (H1) */

  /* Spacing Scale */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.50rem;  /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1.00rem;  /* 16px */
  --space-6: 1.50rem;  /* 24px */
  --space-8: 2.00rem;  /* 32px */

  /* Border Radius Scale */
  --radius-sm: 0.375rem; /* 6px Buttons/Badges */
  --radius-md: 0.500rem; /* 8px Cards/Inputs */
  --radius-lg: 0.750rem; /* 12px Modals/Drawers */
}
```

---

### 3. Application Shell & Navigation Layout

The application utilizes a desktop-first shell architecture consisting of three primary operational zones:

```
+---------------------------------------------------------------------------------------+
|  TOP BAR: [Logo/Breadcrumb] [Global Search Ctrl+K] [System Health: OK] [Notifications] [User Profile]|
+-------------------+-------------------------------------------------------------------+
| SIDEBAR           | MAIN VIEWPORT (Dynamic Route Container)                           |
| (Collapsible)     |                                                                   |
|                   |  +-------------------------------------------------------------+  |
| 📊 Overview       |  | PAGE HEADER (Title, Action Buttons, Time-Range Selector)    |  |
| 🛰️ Live Monitor   |  +-------------------------------------------------------------+  |
| 📈 Traffic Analytics| |                                                             |  |
| ⚠️ Anomalies       |  | STAT CARDS GRID (4 - 6 Key Performance Indicators)          |  |
| 🎯 Threats        |  |                                                             |  |
| 🔔 Alerts Queue   |  +------------------------------+------------------------------+  |
| 📁 Incidents      |  | MAIN CHART / TELEMETRY PANEL | SECONDARY DISTRIBUTION PANEL |  |
| 🌐 Threat Intel   |  +------------------------------+------------------------------+  |
| 📉 Analytics      |  |                                                             |  |
| 📑 Reports        |  | DETAILED DATA TABLE (Filters, Pagination, Actions)          |  |
| 🧠 Model Registry |  |                                                             |  |
|                   |  +-------------------------------------------------------------+  |
| --- ADMIN ---     |                                                                   |
| 👥 Users & Roles  |                                                                   |
| 📋 Audit Logs     |                                                                   |
+-------------------+-------------------------------------------------------------------+
```

---

### 4. Component Library Specifications

#### 4.1 Primitive & Common Components
1. **Button:** Variant-driven (`primary`, `secondary`, `outline`, `danger`, `ghost`). Supports icons, loading states, and disabled keyboard states.
2. **StatCard:** KPI metric component showing big numerical values, percentage delta indicators (e.g. `+12.4%`), trend mini-sparklines, and contextual status badges.
3. **SeverityBadge & StatusBadge:** Contextual pill badges mapping threat severity (`Low`, `Medium`, `High`, `Critical`) and operational status (`NEW`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`) with distinct contrast tokens.
4. **DataTable:** Dense table component with sticky headers, column sorting, pagination controls, status badges, inline actions, and empty/loading skeleton states.
5. **ChartCard:** Container wrapping Recharts components with metric selector tabs, export options, and interactive tooltips.
6. **Modal & Drawer:** Accessible overlays (`ARIA-dialog`, backdrop click handling, ESC key dismissal) for alert details, incident editing, and CSV uploads.

---

### 5. Page Specifications Summary (15 Pages)

| Page Name | Key Features & Layout Components | Primary Purpose |
| :--- | :--- | :--- |
| **1. Login** | Dark centered card, Email/Password inputs, demo user quick-selector pills, error notifications. | User authentication & JWT issuance. |
| **2. Overview Dashboard** | 6 KPI cards, Traffic timeline chart, Anomaly trend, Attack distribution pie, Recent alerts panel, System health indicators. | Centralized SOC operational overview. |
| **3. Live Monitor** | Real-time streaming flow table, Play/Pause/Clear stream controls, protocol filters, anomaly threshold slider. | Real-time traffic monitoring & inspection. |
| **4. Traffic Analytics** | Bandwidth timeline, Top Source/Destination IP lists, Port analysis chart, Protocol breakdowns, Flow details table. | Deep network telemetry exploration. |
| **5. Anomalies** | Anomaly score metrics, High-risk flow table, Isolation Forest decision explanations, feature contribution drawer. | Unsupervised ML anomaly triage. |
| **6. Threats** | Attack classification chart, Threat timeline, Attack category breakdown (DoS, Brute Force, Web, Exploits). | Supervised attack classification review. |
| **7. Alerts Queue** | SOC alert list, Filter bar (Severity, Status, Date), Mass acknowledge/assign actions, Severity badges. | Front-line alert triage & assignment. |
| **8. Alert Detail** | Detailed alert metrics, Packet telemetry view, Explainable Risk Score breakdown, Analyst note thread, Escalation button. | Deep incident analysis & investigation. |
| **9. Incidents** | Incident management table, Case title, Assigned owner, Severity, Status lifecycle, Linked alerts list, Resolution notes. | Multi-alert security case management. |
| **10. Threat Intelligence** | IP reputation checker, Geo-IP distribution map/table, Malicious indicator feed matching, Threat score indicators. | Contextual enrichment for suspicious IPs. |
| **11. Analytics** | Multi-chart dashboard: Attack trends, Risk score distributions, Detection rate trends, Model comparison graphs. | Longitudinal security posture analysis. |
| **12. Reports** | Report generator forms, Preset report cards (Security Summary, Traffic Summary, Alert Report), CSV export buttons. | Stakeholder reporting & compliance exports. |
| **13. Model Registry** | Model cards (Isolation Forest, XGBoost), Accuracy/F1/Precision metrics, Active model indicator, Admin activation toggle. | ML model versioning & performance tracking. |
| **14. User Management** | Users table (Name, Email, Role, Team, Status, Last Login), Create/Edit user modal, Deactivate button (Admin only). | User account & RBAC management. |
| **15. Audit Logs** | Immutable system log table, Timestamp, User, Action, Resource, Details JSON viewer, IP address, Filter bar. | System audit trail & compliance tracking. |

---

### 6. Accessibility & Motion Guidelines

#### Accessibility (WCAG 2.1 AA Compliance)
- Color contrast ratio of $\ge 4.5:1$ for normal text against dark surfaces.
- Color is never used as the single identifier for threat level (all severity indicators pair text labels with color badges).
- All interactive controls feature visible focus ring indicators (`outline: 2px solid #06B6D4`).
- Modals restrict focus trapping and dismiss via the `Escape` key.

#### Animation & Micro-Interactions
- Fast, subtle transition durations ($150\text{ms} - 250\text{ms}$).
- Allowed animations: Sidebar collapse/expand, Drawer slide-in, Toast slide-in, Table loading skeletons.
- Disabled animations automatically when client prefers reduced motion (`@media (prefers-reduced-motion: reduce)`).
