import React from 'react';
import { Terminal, Shield, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';

interface LiveLogViewerProps {
  logs: Array<{
    line_index: number;
    batch_id: number | null;
    text: string;
    status: string;
  }>;
  anchors: Array<any>;
}

export const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ logs, anchors }) => {
  return (
    <div className="bg-[#F4F7FA] dark:bg-[#121216] border border-[#D2DCE8] dark:border-[#24242C] shadow-sm rounded-xl overflow-hidden flex flex-col h-[520px] transition-colors duration-200">
      {/* Header - Soft pearl-slate (#F4F7FA) */}
      <div className="px-5 py-3 border-b border-[#D2DCE8] dark:border-[#24242C] flex items-center justify-between bg-[#F4F7FA] dark:bg-[#121216] transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">
            Live Streaming Security Logs &amp; Cryptographic Proofs
          </h3>
          <span className="text-[10px] text-[#1E293B] dark:text-zinc-400 font-mono bg-[#E2E9F2] dark:bg-[#1E1E24] px-2 py-0.5 rounded border border-[#D2DCE8] dark:border-[#2E2E38]">
            {logs.length} lines
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-[11px] text-[#065F46] dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#065F46] dark:bg-emerald-400"></span>
            Verified On-Chain
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
            Pending Anchor (10s)
          </span>
        </div>
      </div>

      {/* Streaming Log Body: Deeper cool slate (#E2E9F2) in Light Mode with dark slate monospace text (#1E293B), #0E0E12 in Dark Mode */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 select-text bg-[#E2E9F2] dark:bg-[#0E0E12] transition-colors duration-200">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 dark:text-zinc-500 text-xs">
            <p>Waiting for incoming logs from <code className="text-[#3730A3] dark:text-indigo-400 font-mono">data/server.log</code>...</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-600 mt-1">Logs are ingested in real-time and anchored every 10s.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isTampered = log.status === 'TAMPERED';
            const isVerified = log.status === 'VERIFIED_ON_CHAIN';

            return (
              <div
                key={log.line_index}
                className={`flex items-start gap-3 py-1 px-2.5 rounded transition ${
                  isTampered
                    ? 'bg-[#FCE8EC] dark:bg-rose-950/40 border border-[#FECDD3] dark:border-rose-900/50 text-[#9F1239] dark:text-rose-200'
                    : 'hover:bg-[#D2DCE8]/70 dark:hover:bg-[#181820] text-[#1E293B] dark:text-[#E4E4E7]'
                }`}
              >
                {/* Line number */}
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 w-7 select-none text-right shrink-0 pt-0.5">
                  {log.line_index}
                </span>

                {/* Status Badge */}
                <div className="shrink-0 w-32 pt-0.5">
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#065F46] bg-[#E6F6EE] border border-[#A7F3D0] dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      BATCH #{log.batch_id}
                    </span>
                  ) : isTampered ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#9F1239] bg-[#FCE8EC] border border-[#FECDD3] dark:text-rose-300 dark:bg-rose-500/20 dark:border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                      <AlertOctagon className="w-2.5 h-2.5 text-[#9F1239] dark:text-rose-400" />
                      TAMPERED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 border border-amber-300 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 px-2 py-0.5 rounded font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      PENDING
                    </span>
                  )}
                </div>

                {/* Log Line Content: High-contrast dark slate monospace text (#1E293B) */}
                <div className="flex-1 break-all font-mono text-[11.5px] leading-relaxed">
                  {log.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Anchors Footer Strip */}
      {anchors.length > 0 && (
        <div className="border-t border-[#D2DCE8] dark:border-[#24242C] px-5 py-2.5 bg-[#F4F7FA] dark:bg-[#121216] flex items-center gap-3 overflow-x-auto text-[11px] transition-colors duration-200">
          <span className="text-slate-700 dark:text-zinc-400 shrink-0 font-medium flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#3730A3] dark:text-[#6366F1]" /> Anchors:
          </span>
          <div className="flex items-center gap-2">
            {anchors.slice(-5).map((a) => (
              <div
                key={a.batch_id}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] ${
                  a.tampered
                    ? 'bg-[#FCE8EC] border border-[#FECDD3] text-[#9F1239] dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300'
                    : 'bg-[#E2E9F2] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] text-[#1E293B] dark:text-zinc-300'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-white">Batch #{a.batch_id}</span>
                <span className="font-mono text-slate-600 dark:text-zinc-400">{a.merkle_root.substring(0, 10)}...</span>
                <span className="text-slate-500 dark:text-zinc-500 font-mono">({a.log_count} logs)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
