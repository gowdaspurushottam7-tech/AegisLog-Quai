import React, { useState, useEffect } from 'react';
import { CertInBar } from './components/CertInBar';
import { SOCCommandCenter } from './components/SOCCommandCenter';
import { AuditorPortal } from './components/AuditorPortal';
import { Shield, ShieldAlert, Cpu, RefreshCw, Layers, CheckCircle2, RotateCcw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'soc' | 'auditor'>('soc');
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);

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
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const isCompromised = statusData?.is_compromised;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-[#0B1021] border-b border-slate-800/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition ${isCompromised ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
                  AEGISLOG
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  v1.0 ZERO-TRUST
                </span>
                <span className="text-[10px] bg-amber-950/70 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-800/50">
                  🇮🇳 BSA SEC 63
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Tamper-Evident Cryptographic Logging &amp; Indian Court Forensics
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('soc')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'soc'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Tab 1: SOC Command Center
              {isCompromised && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('auditor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'auditor'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Tab 2: Independent Auditor Portal
            </button>
          </div>

          {/* Controls: Reset Demo & Auto-refresh */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
              title="Reset alerts, sync logs from vault, and restore 100% clean green state for judges"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              {resetting ? 'Resetting...' : 'Reset Demo'}
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                autoRefresh
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live Polling (2s)' : 'Polling Paused'}
            </button>
          </div>
        </div>

        {/* CERT-In Compliance Bar */}
        <CertInBar statusData={statusData} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'soc' ? (
          <SOCCommandCenter statusData={statusData} onRefresh={fetchStatus} />
        ) : (
          <AuditorPortal />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#04070F] py-4 text-center text-xs text-slate-500 font-mono">
        <p>
          AegisLog Cryptographic Security Architecture · Designed for CERT-In Compliance (2022 Mandate) &amp; Bharatiya Sakshya Adhiniyam, 2023 (BSA Section 63)
        </p>
      </footer>
    </div>
  );
}

export default App;
