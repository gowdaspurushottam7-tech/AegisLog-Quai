import React from 'react';
import { Terminal, Shield, CheckCircle2, AlertOctagon, Clock, Layers } from 'lucide-react';

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
    <div className="bg-[#090E1A] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[520px]">
      {/* Header */}
      <div className="bg-[#0D1526] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Live Streaming Security Logs &amp; Cryptographic Proofs
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
            {logs.length} Lines Displayed
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED ON-CHAIN
          </span>
          <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" /> PENDING ANCHOR (10s)
          </span>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs select-text">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Layers className="w-8 h-8 mb-2 animate-pulse text-slate-600" />
            <p>Waiting for incoming security logs from agent/data/server.log...</p>
            <p className="text-[11px] text-slate-600 mt-1">Start mock_server.py to generate live Linux security events.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isTampered = log.status === 'TAMPERED';
            const isVerified = log.status === 'VERIFIED_ON_CHAIN';

            return (
              <div
                key={log.line_index}
                className={`flex items-start gap-3 py-1.5 px-2.5 rounded transition ${
                  isTampered
                    ? 'bg-red-950/50 border border-red-700/60 text-red-200'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                {/* Line number */}
                <span className="text-[11px] text-slate-500 w-8 select-none text-right shrink-0">
                  {log.line_index}
                </span>

                {/* Status Badge */}
                <div className="shrink-0 w-36">
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/70 border border-emerald-800/70 text-emerald-300 px-1.5 py-0.5 rounded font-sans font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      BATCH #{log.batch_id} ON-CHAIN
                    </span>
                  ) : isTampered ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-red-900 border border-red-500 text-white px-1.5 py-0.5 rounded font-sans font-bold animate-pulse">
                      <AlertOctagon className="w-3 h-3 text-white" />
                      BATCH #{log.batch_id} TAMPERED!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-950/60 border border-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded font-sans">
                      <Clock className="w-3 h-3 text-amber-400" />
                      PENDING ANCHOR
                    </span>
                  )}
                </div>

                {/* Log Line Content */}
                <div className="flex-1 break-all text-[11.5px] leading-relaxed">
                  {log.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Anchored Batches Strip */}
      {anchors.length > 0 && (
        <div className="bg-[#070C16] border-t border-slate-800 px-4 py-2 flex items-center gap-3 overflow-x-auto text-[11px]">
          <span className="text-slate-400 shrink-0 font-sans font-semibold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-400" /> On-Chain Anchors:
          </span>
          <div className="flex items-center gap-2">
            {anchors.slice(-5).map((a) => (
              <div
                key={a.batch_id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border font-mono ${
                  a.tampered
                    ? 'bg-red-950/70 border-red-600 text-red-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <span className="font-bold text-slate-100">#{a.batch_id}</span>
                <span className="text-slate-500">Root:</span>
                <span className="text-blue-300">{a.merkle_root.substring(0, 8)}...</span>
                <span className="text-slate-500">({a.log_count} logs)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
