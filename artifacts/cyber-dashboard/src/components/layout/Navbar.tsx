import React, { useState } from 'react';
import { Search, Bell, Activity } from 'lucide-react';
import { useListNotifications } from '@workspace/api-client-react';

export const Navbar = () => {
  const { data: notifications } = useListNotifications({ unreadOnly: true });
  const [search, setSearch] = useState('');

  return (
    <div className="h-20 flex items-center justify-between px-8 border-b border-primary/10 bg-[#0B1220]/80 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono font-bold tracking-widest hidden md:flex">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
          SYSTEM_NOMINAL
        </div>
        
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search devices, alerts, or IP addresses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-11 pr-4 bg-black/40 border border-primary/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 focus:bg-black/60 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground font-mono"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <kbd className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded bg-white/5 text-[10px] font-bold text-muted-foreground border border-white/10">⌘</kbd>
              <kbd className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded bg-white/5 text-[10px] font-bold text-muted-foreground border border-white/10">K</kbd>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2.5 text-muted-foreground hover:text-white transition-colors rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10">
          <Bell className="w-5 h-5" />
          {notifications?.data && notifications.data.length > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          )}
        </button>
        <div className="h-8 w-px bg-primary/10"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white tracking-wider">SEC_OP_CENTER</p>
            <p className="text-[10px] font-mono text-primary tracking-widest">{new Date().toISOString().split('T')[0]}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};