import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw, Download, FileText, CheckCircle2, Skull } from 'lucide-react';

interface TamperPanelProps {
  statusData: any;
  onRefresh: () => void;
}

export const TamperPanel: React.FC<TamperPanelProps> = ({ statusData, onRefresh }) => {
  const [recovering, setRecovering] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState<string | null>(null);

  const tamperAlerts = statusData?.tamper_alerts || [];
  const dms = statusData?.dead_man_switch;
  const isAgentKilled = dms?.AGENT_KILLED_ALERT;
  const isCompromised = tamperAlerts.length > 0 || isAgentKilled;

  const handleRecoverAll = async () => {
    setRecovering(true);
    setRecoverMsg(null);
    try {
      const res = await fetch('/api/recover-all', { method: 'POST' });
      const data = await res.json();
      setRecoverMsg(data.message || 'Restored logs successfully from vault.');
      onRefresh();
    } catch (err: any) {
      setRecoverMsg(`Recovery failed: ${err.message}`);
    } finally {
      setRecovering(false);
    }
  };

  const handleExportEvidence = (batchId: number) => {
    window.open(`/api/export-evidence/${batchId}`, '_blank');
  };

  const handleUnkillAgent = async () => {
    try {
      const res = await fetch('/api/attack/restore-agent', { method: 'POST' });
      const data = await res.json();
      setRecoverMsg(data.message || 'Agent restored. Heartbeat resumed cleanly.');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setRecoverMsg(`Failed to resume agent: ${err.message}`);
    }
  };

  if (!isCompromised) {
    return (
      <div className="bg-[#0D1527] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                System Integrity Intact — Zero Tampering Detected
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  ALL BATCHES MATCH ON-CHAIN ROOTS
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic hash chain is continuous. Watchtower Dead Man's Switch is active with normal agent heartbeat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusData?.anchors?.length > 0 && (
              <button
                onClick={() => handleExportEvidence(statusData.anchors[statusData.anchors.length - 1].batch_id)}
                className="flex items-center gap-1.5 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 text-blue-200 text-xs px-3 py-1.5 rounded transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export Latest BSA Sec 63 Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Under attack view with side-by-side diff
  return (
    <div className="border-2 border-red-500 rounded-xl p-6 bg-red-950/30 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse-fast transition-all">
      {/* Alert Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-red-800/60">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 rounded-lg text-white shadow-lg animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-red-200 uppercase tracking-wide">
                ⚠️ FORENSIC INTEGRITY ALARM — RED TEAM TAMPER DETECTED
              </h3>
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                CRITICAL
              </span>
            </div>
            <p className="text-xs text-red-300 mt-1">
              On-chain Merkle Root discrepancy pinpointed! Tampered live lines detected on disk vs immutable smart contract ledger.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRecoverAll}
            disabled={recovering}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recovering ? 'animate-spin' : ''}`} />
            {recovering ? 'Restoring...' : '1-Click Recover Erased Logs'}
          </button>

          {statusData?.anchors?.length > 0 && (
            <button
              onClick={() => handleExportEvidence(tamperAlerts[0]?.batch_id || statusData.anchors[0].batch_id)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-lg transition active:scale-95"
            >
              <FileText className="w-4 h-4" />
              Export BSA Sec 63 Bundle
            </button>
          )}

          {isAgentKilled && (
            <button
              onClick={handleUnkillAgent}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
            >
              Resume Agent Heartbeat
            </button>
          )}
        </div>
      </div>

      {recoverMsg && (
        <div className="mt-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs p-2.5 rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{recoverMsg}</span>
        </div>
      )}

      {/* Dead Man's Switch Banner if agent killed */}
      {isAgentKilled && (
        <div className="mt-4 p-3 bg-black/60 border border-red-700/70 rounded-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skull className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-red-400 uppercase">
                WATCHTOWER DEAD MAN'S SWITCH TRIPPED (AGENT_KILLED_ALERT = TRUE)
              </div>
              <div className="text-[11px] text-slate-300">
                Attacker halted logging agent process or suppressed heartbeat. Detected at: <span className="font-mono text-amber-300 font-bold">{dms.killed_timestamp}</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-red-400 bg-red-950 px-2.5 py-1 rounded border border-red-800">
            {dms.display_status || (
              dms.heartbeat_age_seconds < 15 || dms.kill_flag_active
                ? 'HEARTBEAT HALTED'
                : `Elapsed: ${dms.heartbeat_age_seconds}s > 15s limit`
            )}
          </span>
        </div>
      )}

      {/* Side-by-Side Pinpoint Diff */}
      {tamperAlerts.length > 0 && (
        <div className="mt-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Pinpoint Discrepancy Analysis (Line-by-Line Forensic Audit):
          </h4>

          {tamperAlerts.map((alert: any) => (
            <div key={alert.batch_id} className="bg-[#080E1E] rounded-lg border border-red-900/60 overflow-hidden">
              <div className="bg-red-950/60 px-4 py-2 border-b border-red-900/50 flex items-center justify-between text-xs">
                <span className="font-bold text-red-300 font-mono">
                  BATCH #{alert.batch_id} — {alert.reason}
                </span>
                <span className="text-slate-400">{alert.detected_at}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs font-mono">
                {/* Left: Tampered in Server Log */}
                <div className="p-4 bg-red-950/20">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-red-900/40 text-red-400 font-sans font-bold">
                    <span>❌ TAMPERED / CURRENT DISK LOG</span>
                    <span className="text-[10px] bg-red-900/40 px-2 py-0.5 rounded">data/server.log</span>
                  </div>
                  {alert.mismatches.map((m: any, idx: number) => (
                    <div key={idx} className="mb-2 p-2 bg-red-900/30 border border-red-700/50 rounded">
                      <div className="text-[10px] text-red-300 mb-1">
                        Line {m.global_line_index} [{m.type}]
                      </div>
                      <div className="text-red-200 break-all select-all">{m.current_text}</div>
                    </div>
                  ))}
                  {alert.mismatches.length === 0 && (
                    <div className="text-red-400 italic">Entire log file truncated or deleted (0 bytes).</div>
                  )}
                </div>

                {/* Right: Cryptographically Proven Original in Vault */}
                <div className="p-4 bg-emerald-950/20">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-900/40 text-emerald-400 font-sans font-bold">
                    <span>✅ RECOVERED ORIGINAL (AES-256-GCM VAULT)</span>
                    <span className="text-[10px] bg-emerald-900/40 px-2 py-0.5 rounded">Blockchain Proven</span>
                  </div>
                  {alert.mismatches.map((m: any, idx: number) => (
                    <div key={idx} className="mb-2 p-2 bg-emerald-900/30 border border-emerald-700/50 rounded">
                      <div className="text-[10px] text-emerald-300 mb-1">
                        Original Line {m.global_line_index} [SHA-256 Hash Match]
                      </div>
                      <div className="text-emerald-200 break-all select-all">{m.original_text}</div>
                    </div>
                  ))}
                  {alert.mismatches.length === 0 && (
                    <div className="text-emerald-400 italic">Original logs preserved in encrypted vault. Ready for recovery.</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
