import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-[#0B1220] overflow-hidden text-foreground selection:bg-primary/30 font-sans relative">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10 border-l border-white/5 shadow-2xl">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};