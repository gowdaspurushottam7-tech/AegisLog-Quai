import React, { useState } from 'react';
import { Edit3, Trash2, Skull, ShieldAlert } from 'lucide-react';

interface RedTeamPanelProps {
  onAttackTriggered: () => void;
}

export const RedTeamPanel: React.FC<RedTeamPanelProps> = ({ onAttackTriggered }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerAttack = async (endpoint: string, attackName: string) => {
    setLoading(attackName);
    try {
      await fetch(endpoint, { method: 'POST' });
      onAttackTriggered();
    } catch (err: any) {
      console.error('Attack trigger failed:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-[#F4F7FA] dark:bg-[#111114] border border-[#D2DCE8] dark:border-[#222228] rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Label / Header: Demarcated Adversary Simulation toolbar */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center shrink-0">
          <ShieldAlert size={15} strokeWidth={1.75} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Adversary Simulation
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 hidden md:inline">
            • Anti-forensic attack suite to test cryptographic recovery &amp; BSA §63 admissibility
          </span>
        </div>
      </div>

      {/* 3 Muted Rose Outline Attack Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => triggerAttack('/api/attack/edit', 'edit')}
          disabled={loading !== null}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-rose-300/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 bg-transparent hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50"
          title="Covertly alters 1 line in data/server.log (FAILED_ROOT_LOGIN -> USER_LOGIN)"
        >
          <Edit3 size={14} strokeWidth={1.75} />
          <span>{loading === 'edit' ? 'Attacking...' : 'Edit 1 Line'}</span>
        </button>

        <button
          onClick={() => triggerAttack('/api/attack/wipe', 'wipe')}
          disabled={loading !== null}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-rose-300/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 bg-transparent hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50"
          title="Simulate rm -rf wipe by emptying data/server.log"
        >
          <Trash2 size={14} strokeWidth={1.75} />
          <span>{loading === 'wipe' ? 'Wiping...' : 'Wipe File'}</span>
        </button>

        <button
          onClick={() => triggerAttack('/api/attack/kill-agent', 'kill')}
          disabled={loading !== null}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-rose-300/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 bg-transparent hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50"
          title="Halts agent heartbeat to trip the 15-second Dead Man's Switch"
        >
          <Skull size={14} strokeWidth={1.75} />
          <span>{loading === 'kill' ? 'Killing...' : 'Kill Agent'}</span>
        </button>
      </div>
    </div>
  );
};
