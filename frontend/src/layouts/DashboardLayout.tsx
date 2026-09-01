import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

interface DashboardLayoutProps {
  pageTitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ pageTitle }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0F1629] to-[#0A0E27] text-gray-100 flex overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title={pageTitle} />
        <main className="p-6 flex-1 bg-gradient-to-br from-[#0A0E27] via-[#0F1629] to-[#0A0E27]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
