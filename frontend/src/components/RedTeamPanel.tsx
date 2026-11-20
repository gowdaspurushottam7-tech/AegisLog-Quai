import React, { useState } from 'react';
import { Edit3, Trash2, Skull, Flame } from 'lucide-react';

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
    <div className="bg-[#F4F7FA] dark:bg-[#121216] border border-[#D2DCE8] dark:border-[#24242C] shadow-sm rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-200">
      {/* Label / Header: Soft blush rose (#FCE8EC) icon badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[#FCE8EC] text-[#9F1239] border border-[#FECDD3] dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 flex items-center justify-center shrink-0">
          <Flame className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">
            Live Attack Simulator
          </span>
          <span className="text-[11px] text-slate-600 dark:text-zinc-400 ml-2 hidden sm:inline">
            Execute anti-forensic attacks against live logs to test cryptographic recovery
          </span>
        </div>
      </div>

      {/* 3 Compact Attack Buttons - Cool slate (#E2E9F2) with hover to blush rose (#FCE8EC) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => triggerAttack('/api/attack/edit', 'edit')}
          disabled={loading !== null}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E2E9F2] hover:bg-[#FCE8EC] text-[#1E293B] hover:text-[#9F1239] border border-[#D2DCE8] hover:border-[#FECDD3] dark:bg-[#0E0E12] dark:hover:bg-rose-950/30 dark:text-zinc-300 dark:hover:text-rose-200 dark:border-[#24242C] dark:hover:border-rose-900/60 transition active:scale-95 disabled:opacity-50"
          title="Covertly alters 1 line in data/server.log (FAILED_ROOT_LOGIN -> USER_LOGIN)"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#9F1239] dark:text-rose-400" />
          <span>{loading === 'edit' ? 'Attacking...' : 'Edit 1 Line'}</span>
        </button>

        <button
          onClick={() => triggerAttack('/api/attack/wipe', 'wipe')}
          disabled={loading !== null}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E2E9F2] hover:bg-[#FCE8EC] text-[#1E293B] hover:text-[#9F1239] border border-[#D2DCE8] hover:border-[#FECDD3] dark:bg-[#0E0E12] dark:hover:bg-rose-950/30 dark:text-zinc-300 dark:hover:text-rose-200 dark:border-[#24242C] dark:hover:border-rose-900/60 transition active:scale-95 disabled:opacity-50"
          title="Simulate rm -rf wipe by emptying data/server.log"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#9F1239] dark:text-rose-400" />
          <span>{loading === 'wipe' ? 'Wiping...' : 'Wipe File'}</span>
        </button>

        <button
          onClick={() => triggerAttack('/api/attack/kill-agent', 'kill')}
          disabled={loading !== null}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E2E9F2] hover:bg-[#FCE8EC] text-[#1E293B] hover:text-[#9F1239] border border-[#D2DCE8] hover:border-[#FECDD3] dark:bg-[#0E0E12] dark:hover:bg-rose-950/30 dark:text-zinc-300 dark:hover:text-rose-200 dark:border-[#24242C] dark:hover:border-rose-900/60 transition active:scale-95 disabled:opacity-50"
          title="Halts agent heartbeat to trip the 15-second Dead Man's Switch"
        >
          <Skull className="w-3.5 h-3.5 text-[#9F1239] dark:text-rose-400" />
          <span>{loading === 'kill' ? 'Killing...' : 'Kill Agent'}</span>
        </button>
      </div>
    </div>
  );
};
