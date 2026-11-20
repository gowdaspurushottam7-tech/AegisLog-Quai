import React, { useState } from 'react';
import { Flame, Edit3, Trash2, Skull, RefreshCw, Terminal, RotateCcw, CheckCircle2 } from 'lucide-react';

interface RedTeamPanelProps {
  onAttackTriggered: () => void;
}

export const RedTeamPanel: React.FC<RedTeamPanelProps> = ({ onAttackTriggered }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const [lastAttackLog, setLastAttackLog] = useState<any>(null);

  const triggerAttack = async (endpoint: string, attackName: string) => {
    setLoading(attackName);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      setLastAttackLog({
        timestamp: new Date().toLocaleTimeString(),
        attackName,
        data,
      });
      onAttackTriggered();
    } catch (err: any) {
      setLastAttackLog({
        timestamp: new Date().toLocaleTimeString(),
        attackName,
        data: { error: err.message },
      });
    } finally {
      setLoading(null);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      setLastAttackLog({
        timestamp: new Date().toLocaleTimeString(),
        attackName: 'Demo Reset (100% Green State)',
        data,
      });
      onAttackTriggered();
    } catch (err: any) {
      setLastAttackLog({
        timestamp: new Date().toLocaleTimeString(),
        attackName: 'Demo Reset Error',
        data: { error: err.message },
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-[#0B1120] border border-red-950/80 rounded-xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-950/70 border border-red-800/60 rounded-lg text-red-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Red Team Attack Simulator
              <span className="text-[10px] bg-red-900/40 text-red-300 font-mono px-2 py-0.5 rounded border border-red-700/40">
                LIVE STRESS TEST
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Trigger real covert attacks against <code className="text-blue-400">data/server.log</code> to watch the cryptographic proof trigger instant alarms.
            </p>
          </div>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={resetting || loading !== null}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 disabled:opacity-50"
          title="Reset all alerts, restore logs from vault, and clear CERT-In timer to start 100% green"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting Demo...' : 'Reset Demo (Clean State)'}
        </button>
      </div>

      {/* 3 Red Team Attack Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Attack 1: Covert Log Edit */}
        <button
          onClick={() => triggerAttack('/api/attack/edit', 'Covert Log Edit')}
          disabled={loading !== null}
          className="group relative flex flex-col items-start p-3.5 bg-gradient-to-b from-red-950/40 to-slate-900 border border-red-900/60 hover:border-red-500 rounded-lg text-left transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-xs font-bold text-red-300 group-hover:text-red-200 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-red-400" />
              1. Simulate Log Edit
            </span>
            <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800 font-mono">
              TAMPER 1 LINE
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Alters <span className="text-slate-300 font-mono">FAILED_ROOT_LOGIN</span> to <span className="text-emerald-400 font-mono">USER_LOGIN</span> covertly.
          </p>
        </button>

        {/* Attack 2: Wipe Logs rm -rf */}
        <button
          onClick={() => triggerAttack('/api/attack/wipe', 'rm -rf Log Wipe')}
          disabled={loading !== null}
          className="group relative flex flex-col items-start p-3.5 bg-gradient-to-b from-red-950/40 to-slate-900 border border-red-900/60 hover:border-red-500 rounded-lg text-left transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-xs font-bold text-red-300 group-hover:text-red-200 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              2. Simulate rm -rf Wipe
            </span>
            <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800 font-mono">
              ZERO FILE
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Empties <span className="text-slate-300 font-mono">data/server.log</span> simulating anti-forensic log deletion.
          </p>
        </button>

        {/* Attack 3: Kill Logging Agent */}
        <button
          onClick={() => triggerAttack('/api/attack/kill-agent', 'Kill Logging Agent')}
          disabled={loading !== null}
          className="group relative flex flex-col items-start p-3.5 bg-gradient-to-b from-red-950/40 to-slate-900 border border-red-900/60 hover:border-red-500 rounded-lg text-left transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-xs font-bold text-red-300 group-hover:text-red-200 flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              3. Kill Logging Agent
            </span>
            <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800 font-mono">
              DEAD MAN'S SWITCH
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Halts agent heartbeat. Dead Man's Switch trips in 15 seconds.
          </p>
        </button>
      </div>

      {/* Terminal Output */}
      {lastAttackLog && (
        <div className="mt-4 p-3 bg-black/80 border border-slate-800 rounded-lg font-mono text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-red-400">
              <Terminal className="w-3 h-3" /> Red Team Action Payload
            </span>
            <span>{lastAttackLog.timestamp}</span>
          </div>
          <pre className="text-red-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(lastAttackLog.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
