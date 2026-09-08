import TrafficChart from "@/components/TrafficChart";
import AlertFeed from "@/components/AlertFeed";
import { Activity, ShieldAlert, AlertTriangle } from "lucide-react";

export default function AnalystDashboard() {
  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 animate-fade-in-up delay-0">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Connections</p>
            <h3 className="text-2xl font-bold text-gray-900">2,405</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 animate-fade-in-up delay-1">
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Threats Blocked</p>
            <h3 className="text-2xl font-bold text-gray-900">142</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 animate-fade-in-up delay-2">
          <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
            <h3 className="text-2xl font-bold text-gray-900">3</h3>
          </div>
        </div>
      </div>

      {/* Charts and Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-fade-in-up delay-3">
          <TrafficChart />
        </div>
        <div className="lg:col-span-1 animate-fade-in-up delay-3">
          <AlertFeed />
        </div>
      </div>
    </div>
  );
}
