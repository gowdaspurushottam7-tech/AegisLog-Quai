import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, Download, FileText, CheckCircle2, Skull, Play, Clock, Layers, HardDrive, Activity } from 'lucide-react';

interface TamperPanelProps {
  statusData: any;
  onRefresh: () => void;
}

export const TamperPanel: React.FC<TamperPanelProps> = ({ statusData, onRefresh }) => {
  const [recovering, setRecovering] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState<string | null>(null);

  const tamperAlerts = statusData?.tamper_alerts || [];
  const dms = statusData?.dead_man_switch;
  const isAgentKilled = Boolean(dms?.AGENT_KILLED_ALERT);
  const isCompromised = tamperAlerts.length > 0 || isAgentKilled;

  const anchors = statusData?.anchors || [];
  const logs = statusData?.live_logs || [];
  const totalLogs = statusData?.cert_in_retention?.total_logs_stored ?? logs.length;
  const totalBatches = anchors.length;

  const countdown = statusData?.incident_countdown;
  const countdownDisplay = countdown?.countdown_display || '06:00:00';

  const handleRecoverAll = async () => {
    setRecovering(true);
    setRecoverMsg(null);
    try {
      const res = await fetch('/api/recover-all', { method: 'POST' });
      const data = await res.json();
      setRecoverMsg(data.message || 'Restored all logs successfully from vault.');
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

  const targetBatchId =
    tamperAlerts[0]?.batch_id ??
    (anchors.length > 0 ? anchors[anchors.length - 1].batch_id : 1);

  // Normal State: Calm, spacious soft pearl-slate card with soft mint status and cool slate stat boxes
  if (!isCompromised) {
    return (
      <div className="bg-[#F4F7FA] dark:bg-[#121216] border border-[#D2DCE8] dark:border-[#24242C] shadow-sm rounded-xl p-6 transition-colors duration-200">
        {/* Calm Green Status Banner - Soft Mint (#E6F6EE) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#D2DCE8] dark:border-[#24242C] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E6F6EE] dark:bg-emerald-500/10 border border-[#A7F3D0] dark:border-emerald-500/20 flex items-center justify-center text-[#065F46] dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  All Logs Cryptographically Verified
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F6EE] text-[#065F46] border border-[#A7F3D0] dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#065F46] dark:bg-emerald-400"></span>
                  180-Day CERT-In Retention
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                Continuous SHA-256 Merkle tree anchors match Hardhat smart contract ledger. Zero discrepancies detected.
              </p>
            </div>
          </div>

          {anchors.length > 0 && (
            <button
              onClick={() => handleExportEvidence(targetBatchId)}
              className="self-start sm:self-auto flex items-center gap-2 text-xs font-medium text-[#1E293B] dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-[#E2E9F2] hover:bg-[#D2DCE8] dark:bg-[#181820] dark:hover:bg-[#20202a] border border-[#D2DCE8] dark:border-[#24242C] px-3 py-2 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              Export BSA Sec 63 Proof
            </button>
          )}
        </div>

        {/* 3 Clean Stat Numbers - Deeper cool slate (#E2E9F2) with dark slate text (#1E293B) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#E2E9F2] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] transition-colors duration-200">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 text-xs font-medium mb-1.5">
              <span>Batches Anchored</span>
              <Layers className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#1E293B] dark:text-white tracking-tight">
              {totalBatches}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
              On-chain at 10s intervals
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#E2E9F2] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] transition-colors duration-200">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 text-xs font-medium mb-1.5">
              <span>Sealed Logs</span>
              <HardDrive className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#1E293B] dark:text-white tracking-tight">
              {totalLogs}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
              Backed up in AES-256-GCM vault
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#E2E9F2] dark:bg-[#0E0E12] border border-[#D2DCE8] dark:border-[#24242C] transition-colors duration-200">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 text-xs font-medium mb-1.5">
              <span>Watchtower Status</span>
              <Activity className="w-4 h-4 text-[#065F46] dark:text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 text-2xl font-bold font-mono text-[#065F46] dark:text-emerald-400 tracking-tight">
              Healthy
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
              15s Dead Man's Switch active
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Attack State: Soft blush rose (#FCE8EC) with #9F1239 text and #FECDD3 border in light mode
  return (
    <div className="bg-[#FCE8EC] dark:bg-[#121216] border border-[#FECDD3] dark:border-rose-500/50 shadow-sm rounded-xl p-6 transition-all duration-300 space-y-6">
      {/* Alert Header with 6-Hour Countdown & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#FECDD3] dark:border-rose-900/40">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#FECDD3] dark:bg-rose-500/10 border border-[#FECDD3] dark:border-rose-500/30 flex items-center justify-center text-[#9F1239] dark:text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-semibold text-[#9F1239] dark:text-white">
                Forensic Discrepancy Pinpointed
              </h2>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FECDD3] text-[#9F1239] border border-[#FECDD3] dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
                Tamper Detected
              </span>
            </div>
            <p className="text-xs text-[#9F1239]/90 dark:text-rose-300/80 mt-1">
              On-chain Merkle root does not match disk logs. Red team activity isolated by forensic engine.
            </p>
          </div>
        </div>

        {/* 6-Hour CERT-In Countdown & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 6-Hour Countdown */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#F4F7FA] dark:bg-rose-950/40 border border-[#FECDD3] dark:border-rose-800/60">
            <Clock className="w-4 h-4 text-[#9F1239] dark:text-rose-400" />
            <div>
              <span className="text-[10px] text-[#9F1239]/80 dark:text-rose-300/70 block uppercase font-medium leading-none">
                CERT-In Mandatory Window
              </span>
              <span className="font-mono font-bold text-sm text-[#9F1239] dark:text-rose-400">
                {countdownDisplay}
              </span>
            </div>
          </div>

          {/* Prominent Buttons */}
          <button
            onClick={handleRecoverAll}
            disabled={recovering}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recovering ? 'animate-spin' : ''}`} />
            {recovering ? 'Restoring...' : 'Recover Logs'}
          </button>

          <button
            onClick={() => handleExportEvidence(targetBatchId)}
            className="flex items-center gap-2 bg-[#4F46E5] hover:bg-indigo-700 dark:bg-[#6366F1] dark:hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition active:scale-95 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            Export BSA Sec 63 Proof
          </button>

          {isAgentKilled && (
            <button
              onClick={handleUnkillAgent}
              className="flex items-center gap-1.5 bg-[#E2E9F2] hover:bg-[#D2DCE8] dark:bg-[#181820] dark:hover:bg-[#20202a] text-[#1E293B] dark:text-zinc-200 font-medium text-xs px-3 py-2 rounded-lg border border-[#D2DCE8] dark:border-[#24242C] transition"
            >
              <Play className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-400" />
              Resume Heartbeat
            </button>
          )}
        </div>
      </div>

      {recoverMsg && (
        <div className="bg-[#E6F6EE] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-700/50 text-[#065F46] dark:text-emerald-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#065F46] dark:text-emerald-400 shrink-0" />
          <span>{recoverMsg}</span>
        </div>
      )}

      {/* Dead Man's Switch Banner if tripped */}
      {isAgentKilled && (
        <div className="p-3.5 rounded-lg bg-[#FECDD3]/50 dark:bg-rose-950/30 border border-[#FECDD3] dark:border-rose-800/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Skull className="w-4 h-4 text-[#9F1239] dark:text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold text-[#9F1239] dark:text-rose-200">Watchtower Dead Man's Switch Tripped: </span>
              <span className="text-slate-800 dark:text-zinc-300">
                Agent process halted. Detected at{' '}
                <span className="font-mono text-amber-700 dark:text-amber-300 font-medium">{dms?.killed_timestamp}</span>
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#9F1239] dark:text-rose-300 bg-[#FECDD3] dark:bg-rose-900/40 px-2 py-0.5 rounded border border-[#FECDD3] dark:border-rose-800/60 shrink-0">
            {dms?.display_status || 'HEARTBEAT HALTED'}
          </span>
        </div>
      )}

      {/* Side-by-Side Pinpoint Diff */}
      {tamperAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-400 font-medium">
            <span>Pinpoint Discrepancy Analysis (Line-by-Line Forensic Audit)</span>
            <span className="text-[11px] text-slate-600 dark:text-zinc-500 font-mono">
              Batch #{tamperAlerts[0]?.batch_id} · {tamperAlerts[0]?.detected_at}
            </span>
          </div>

          {tamperAlerts.map((alert: any) => (
            <div
              key={alert.batch_id}
              className="rounded-lg border border-[#D2DCE8] dark:border-[#24242C] bg-[#E2E9F2] dark:bg-[#0E0E12] overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#D2DCE8] dark:divide-[#24242C] text-xs">
                {/* Left: Tampered in Server Log */}
                <div className="p-4 bg-[#FCE8EC]/70 dark:bg-rose-950/15 space-y-2">
                  <div className="flex items-center justify-between text-[#9F1239] dark:text-rose-400 font-medium pb-2 border-b border-[#FECDD3] dark:border-rose-900/30">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#9F1239]"></span>
                      Tampered Disk Log (data/server.log)
                    </span>
                    <span className="text-[10px] font-mono text-[#9F1239] dark:text-rose-400/80">Tampered</span>
                  </div>

                  {alert.mismatches && alert.mismatches.length > 0 ? (
                    alert.mismatches.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-[#F4F7FA] dark:bg-[#0E0E12] border border-[#FECDD3] dark:border-rose-900/40 font-mono text-[11px]"
                      >
                        <div className="text-[10px] text-[#9F1239] dark:text-rose-400/80 mb-1 font-semibold">
                          Line {m.global_line_index} · {m.type}
                        </div>
                        <div className="text-[#9F1239] dark:text-rose-200 break-all select-all font-mono font-medium">
                          {m.current_text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#9F1239] dark:text-rose-400/70 italic py-2">
                      File completely truncated or emptied (0 bytes).
                    </div>
                  )}
                </div>

                {/* Right: Cryptographically Proven Original in Vault */}
                <div className="p-4 bg-[#E6F6EE]/70 dark:bg-emerald-950/15 space-y-2">
                  <div className="flex items-center justify-between text-[#065F46] dark:text-emerald-400 font-medium pb-2 border-b border-[#A7F3D0] dark:border-emerald-900/30">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#065F46]"></span>
                      Recovered Original (AES-256-GCM Vault)
                    </span>
                    <span className="text-[10px] font-mono text-[#065F46] dark:text-emerald-400/80">Blockchain Proven</span>
                  </div>

                  {alert.mismatches && alert.mismatches.length > 0 ? (
                    alert.mismatches.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-[#F4F7FA] dark:bg-[#0E0E12] border border-[#A7F3D0] dark:border-emerald-900/40 font-mono text-[11px]"
                      >
                        <div className="text-[10px] text-[#065F46] dark:text-emerald-400/80 mb-1 font-semibold">
                          Original Line {m.global_line_index} · Verified Root
                        </div>
                        <div className="text-[#065F46] dark:text-emerald-200 break-all select-all font-mono font-medium">
                          {m.original_text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#065F46] dark:text-emerald-400/70 italic py-2">
                      Original logs preserved in encrypted vault. Ready for recovery.
                    </div>
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
