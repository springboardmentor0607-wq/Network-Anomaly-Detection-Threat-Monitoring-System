import { Bell, User } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">System Overview</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100 relative text-gray-500 ui-transition active-scale">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-gray-100 ui-transition active-scale">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
            A
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
        </div>
      </div>
    </header>
  );
}
