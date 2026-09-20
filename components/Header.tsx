"use client";

import React from 'react';
import { Zap, ShieldCheck, Phone, Clock } from 'lucide-react';

export default function Header() {
  const [time, setTime] = React.useState<string>('');

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-emerald-900/30 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 rounded-md bg-emerald-900/50 text-emerald-300 text-xs font-bold border border-emerald-600/40 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-400" /> NON-GST CASH MEMO DESK
        </span>
        <span className="text-xs text-slate-400 hidden md:inline-flex items-center gap-1">
          <Phone className="w-3 h-3 text-emerald-400" /> Mob: 7008690038, 8984038934
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{time || '--:--:--'}</span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-700/40">
          <ShieldCheck className="w-3.5 h-3.5" /> 24/7 Cloud Ready
        </span>
      </div>
    </header>
  );
}

export { Header };
