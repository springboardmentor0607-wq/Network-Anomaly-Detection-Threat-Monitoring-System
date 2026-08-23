import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const AnalystLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#060911]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Security Analyst Operations Center" />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AnalystLayout;
