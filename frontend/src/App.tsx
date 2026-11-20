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
    <div className="min-h-screen bg-[#EAEFF5] dark:bg-[#0A0A0C] text-[#0F172A] dark:text-[#F4F4F5] flex flex-col font-sans transition-colors duration-200">
      {/* Top Header - Soft pearl-slate in light mode (#F4F7FA) */}
      <header className="h-14 border-b border-[#D2DCE8] dark:border-[#24242C] bg-[#F4F7FA]/90 dark:bg-[#0A0A0C]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#E0E7FF] dark:bg-indigo-500/10 border border-[#C7D2FE] dark:border-indigo-500/30 flex items-center justify-center text-[#3730A3] dark:text-[#6366F1]">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">AegisLog</span>
              <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-mono border border-[#D2DCE8] dark:border-[#24242C] bg-[#E2E9F2] dark:bg-[#121216] rounded px-1.5 py-0.5">
                BSA Sec 63
              </span>
            </div>
          </div>

          {/* Centered 2-Tab Pill Switcher: Soft periwinkle tint (#E0E7FF) with deep indigo text (#3730A3) in light mode */}
          <div className="flex items-center bg-[#E2E9F2] dark:bg-[#121216] border border-[#D2DCE8] dark:border-[#24242C] p-0.5 rounded-lg shadow-inner">
            <button
              onClick={() => setActiveTab('soc')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'soc'
                  ? 'bg-[#E0E7FF] text-[#3730A3] font-semibold dark:bg-[#6366F1] dark:text-white shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Live Monitor
            </button>
            <button
              onClick={() => setActiveTab('auditor')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'auditor'
                  ? 'bg-[#E0E7FF] text-[#3730A3] font-semibold dark:bg-[#6366F1] dark:text-white shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Auditor Verify
            </button>
          </div>

          {/* Right Controls: Single Status Dot + Reset Demo + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Single Integrity Status Dot */}
            <div className="flex items-center gap-2 text-xs font-medium">
              {isCompromised ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-[#9F1239] dark:text-rose-400 font-semibold hidden sm:inline">Tamper Alert</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[#065F46] dark:text-emerald-400 font-medium hidden sm:inline">Verified</span>
                </>
              )}
            </div>

            {/* Reset Demo Button */}
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center gap-1.5 text-xs text-[#1E293B] dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-[#E2E9F2] hover:bg-[#D2DCE8] dark:bg-[#121216] dark:hover:bg-[#1c1c24] border border-[#D2DCE8] dark:border-[#24242C] px-2.5 py-1.5 rounded-md transition active:scale-95 disabled:opacity-50"
              title="Reset alerts, restore logs from vault, and clear CERT-In timer to start 100% green"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{resetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>

            {/* Theme Toggle (Sun/Moon) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-[#1E293B] hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white bg-[#E2E9F2] hover:bg-[#D2DCE8] dark:bg-[#121216] dark:hover:bg-[#1c1c24] border border-[#D2DCE8] dark:border-[#24242C] transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#3730A3]" />
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

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-[#D2DCE8] dark:border-[#24242C] py-3 text-center text-[11px] text-slate-500 dark:text-zinc-500 bg-[#F4F7FA] dark:bg-[#0A0A0C] transition-colors duration-200">
        <p>AegisLog Zero-Trust Cryptographic Forensics · CERT-In Compliant · BSA Section 63 Schedule Certificate</p>
      </footer>
    </div>
  );
}

export default App;
