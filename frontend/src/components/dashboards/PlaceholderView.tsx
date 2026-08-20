"use client";

import { Construction } from "lucide-react";

export default function PlaceholderView({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string; 
  description: string; 
  icon: any; 
}) {
  return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center animate-blur-fade-up p-6">
      <div className="w-24 h-24 rounded-full liquid-glass flex items-center justify-center border border-white/10 mb-6 bg-black/40">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-center max-w-md mb-8">{description}</p>
      
      <div className="flex items-center gap-3 px-4 py-2 rounded-full liquid-glass border border-white/10 text-sm text-gray-300">
        <Construction className="w-4 h-4 text-amber-500" />
        <span>Module under development</span>
      </div>
    </div>
  );
}
