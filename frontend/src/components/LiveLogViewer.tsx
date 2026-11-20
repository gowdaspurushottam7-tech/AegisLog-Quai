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
    <div className="bg-[#F4F7FA] dark:bg-[#111114] border border-[#D2DCE8] dark:border-[#222228] rounded-lg overflow-hidden flex flex-col h-[520px]">
      {/* Header - Datadog/Cloudflare style terminal header */}
      <div className="px-4 py-2.5 border-b border-[#D2DCE8] dark:border-[#222228] flex items-center justify-between bg-[#F4F7FA] dark:bg-[#111114]">
        <div className="flex items-center gap-2.5">
          <Terminal size={15} strokeWidth={1.75} className="text-slate-500 dark:text-zinc-400" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Security Log Stream
          </h3>
          <span className="text-[10px] font-mono tabular-nums text-slate-700 dark:text-zinc-400 bg-[#E2E9F2] dark:bg-[#18181D] px-2 py-0.5 rounded border border-[#D2DCE8] dark:border-[#2A2A34]">
            {logs.length} LINES
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Verified On-Chain
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pending Anchor (10s)
          </span>
        </div>
      </div>

      {/* Streaming Log Body: Cool slate #E2E9F2 in Light Mode, Matte #0E0E12 in Dark Mode */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 select-text bg-[#E2E9F2] dark:bg-[#0E0E12]">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-zinc-500 text-xs">
            <p>Ingesting real-time security events from <code className="text-indigo-600 dark:text-indigo-400 font-mono">data/server.log</code></p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-600 mt-1">Logs are sealed and anchored to smart contract every 10s</p>
          </div>
        ) : (
          logs.map((log) => {
            const isTampered = log.status === 'TAMPERED';
            const isVerified = log.status === 'VERIFIED_ON_CHAIN';

            return (
              <div
                key={log.line_index}
                className={`flex items-start gap-2.5 py-1 px-2 rounded-sm transition font-mono ${
                  isTampered
                    ? 'bg-rose-500/10 dark:bg-rose-950/40 border-l-2 border-rose-500 text-rose-900 dark:text-rose-200'
                    : 'hover:bg-[#D2DCE8]/60 dark:hover:bg-[#181820] text-[#1E293B] dark:text-[#E4E4E7]'
                }`}
              >
                {/* Line number */}
                <span className="text-[11px] tabular-nums font-mono text-slate-400 dark:text-zinc-600 w-7 select-none text-right shrink-0 pt-0.5">
                  {log.line_index}
                </span>

                {/* Status Badge */}
                <div className="shrink-0 w-28 pt-0.5">
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-medium tabular-nums">
                      <CheckCircle2 size={11} strokeWidth={2} />
                      BATCH #{log.batch_id}
                    </span>
                  ) : isTampered ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-500/15 border border-rose-500/30 dark:text-rose-300 dark:bg-rose-500/20 dark:border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                      <AlertOctagon size={11} strokeWidth={2} className="text-rose-600 dark:text-rose-400" />
                      TAMPERED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-500/10 border border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                      <Clock size={11} strokeWidth={2} />
                      PENDING
                    </span>
                  )}
                </div>

                {/* Log Line Content: High-contrast monospace */}
                <div className="flex-1 break-all text-[11.5px] leading-relaxed">
                  {log.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Anchors Footer Strip */}
      {anchors.length > 0 && (
        <div className="border-t border-[#D2DCE8] dark:border-[#222228] px-4 py-2 bg-[#F4F7FA] dark:bg-[#111114] flex items-center gap-3 overflow-x-auto text-[11px]">
          <span className="text-slate-600 dark:text-zinc-400 shrink-0 font-medium flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
            <Shield size={13} strokeWidth={1.75} className="text-indigo-600 dark:text-indigo-400" /> Recent Anchors:
          </span>
          <div className="flex items-center gap-2">
            {anchors.slice(-5).map((a) => (
              <div
                key={a.batch_id}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono tabular-nums ${
                  a.tampered
                    ? 'bg-rose-500/10 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                    : 'bg-[#E2E9F2] dark:bg-[#0E0E12] border-[#D2DCE8] dark:border-[#222228] text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-zinc-100">Batch #{a.batch_id}</span>
                <span className="text-slate-500 dark:text-zinc-500">{a.merkle_root.substring(0, 10)}...</span>
                <span className="text-slate-400 dark:text-zinc-600">({a.log_count} logs)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
