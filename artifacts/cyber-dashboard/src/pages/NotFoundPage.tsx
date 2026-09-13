import React from 'react';
import { Link } from 'wouter';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center relative overflow-hidden selection:bg-primary/30">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoNTksIDEzMCwgMjQ2LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center p-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 text-red-500/50 text-9xl font-black font-mono blur-sm animate-pulse mix-blend-screen">404</div>
          <div className="absolute inset-0 text-cyan-500/50 text-9xl font-black font-mono translate-x-1 translate-y-1 blur-sm mix-blend-screen">404</div>
          <h1 className="text-9xl font-black font-mono text-white relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">404</h1>
        </div>
        
        <div className="flex items-center gap-3 text-red-500 mb-6 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-xl font-bold tracking-widest uppercase">Target Not Found</h2>
        </div>
        
        <p className="text-muted-foreground max-w-md mb-8 font-mono">
          The requested resource pathway does not exist on this node. Connection terminated.
        </p>
        
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-1"
        >
          <Home className="w-5 h-5" />
          RETURN TO COMMAND CENTER
        </Link>
      </div>
    </div>
  );
}