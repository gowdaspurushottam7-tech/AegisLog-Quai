import React, { useState, useEffect } from 'react';
import { SOCCommandCenter } from './components/SOCCommandCenter';
import { AuditorPortal } from './components/AuditorPortal';
import { Shield, RotateCcw, Sun, Moon } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'soc' | 'auditor'>('soc');
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);

  // Theme Toggle: Defaults to 'dark', persists in localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aegislog-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('aegislog-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.warn('API fetch status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      await res.json();
      await fetchStatus();
    } catch (err) {
      console.error('Reset demo error:', err);
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const isCompromised = Boolean(
    statusData?.is_compromised ||
    statusData?.dead_man_switch?.AGENT_KILLED_ALERT ||
    (statusData?.tamper_alerts && statusData.tamper_alerts.length > 0)
  );

  return (
    <div className="min-h-screen bg-[#EAEFF5] dark:bg-[#09090B] text-[#0F172A] dark:text-[#F4F4F5] flex flex-col font-sans transition-colors duration-150">
      {/* Top Navigation Bar: Compact 56px height with clean 1px border */}
      <header className="h-14 border-b border-[#D2DCE8] dark:border-[#222228] bg-[#F4F7FA]/95 dark:bg-[#111114]/95 backdrop-blur-sm sticky top-0 z-50 px-4 sm:px-6 transition-colors duration-150">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Clean Left-Aligned Brand Mark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shield size={15} strokeWidth={1.75} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
                AegisLog
              </span>
              <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono uppercase tracking-wider border border-[#D2DCE8] dark:border-[#222228] bg-[#E2E9F2]/70 dark:bg-[#16161A] rounded px-1.5 py-0.5">
                SOC / BSA §63
              </span>
            </div>
          </div>

          {/* Centered Minimal Underline Tabs */}
          <nav className="flex items-center h-full space-x-1">
            <button
              onClick={() => setActiveTab('soc')}
              className={`h-14 px-3.5 border-b-2 text-xs font-medium inline-flex items-center gap-2 transition-colors ${
                activeTab === 'soc'
                  ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Live SOC Monitor
            </button>
            <button
              onClick={() => setActiveTab('auditor')}
              className={`h-14 px-3.5 border-b-2 text-xs font-medium inline-flex items-center gap-2 transition-colors ${
                activeTab === 'auditor'
                  ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Independent Auditor Portal
            </button>
          </nav>

          {/* Right-Aligned Utility Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Semantic Restraint Status Indicator: Subtle 6px dot + clean badge */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {isCompromised ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider hidden sm:inline">
                    TAMPER DETECTED
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider hidden sm:inline">
                    VERIFIED
                  </span>
                </div>
              )}
            </div>

            {/* Understated Reset Demo Button */}
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-[#F4F7FA] hover:bg-[#E2E9F2] dark:bg-[#111114] dark:hover:bg-[#18181D] border border-[#D2DCE8] dark:border-[#222228] rounded-md px-2.5 py-1.5 transition active:scale-95 disabled:opacity-50"
              title="Reset alerts, restore logs from vault, and clear CERT-In timer to start green"
            >
              <RotateCcw size={14} strokeWidth={1.75} className={`text-slate-500 dark:text-zinc-400 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{resetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white bg-[#F4F7FA] hover:bg-[#E2E9F2] dark:bg-[#111114] dark:hover:bg-[#18181D] border border-[#D2DCE8] dark:border-[#222228] transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={15} strokeWidth={1.75} className="text-amber-400" />
              ) : (
                <Moon size={15} strokeWidth={1.75} className="text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'soc' ? (
          <SOCCommandCenter statusData={statusData} onRefresh={fetchStatus} />
        ) : (
          <AuditorPortal />
        )}
      </main>

      {/* Clean Minimalist Executive Footer */}
      <footer className="border-t border-[#D2DCE8] dark:border-[#222228] py-3 text-center text-[11px] text-slate-500 dark:text-zinc-500 bg-[#F4F7FA] dark:bg-[#111114] transition-colors duration-150">
        <p>AegisLog Cryptographic Security Architecture · CERT-In Direction 70B &amp; BSA Section 63 Schedule Certificate</p>
      </footer>
    </div>
  );
}

export default App;
