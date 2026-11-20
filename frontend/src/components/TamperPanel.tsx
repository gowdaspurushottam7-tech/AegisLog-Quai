import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Download,
  FileText,
  CheckCircle2,
  Skull,
  Play,
  Clock,
  Layers,
  Activity,
  Database
} from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {/* KPI Strip: Clean 4-column horizontal metric bar with hairline dividers */}
      <div className="bg-[#F4F7FA] dark:bg-[#111114] border border-[#D2DCE8] dark:border-[#222228] rounded-lg overflow-hidden shadow-sm transition-colors duration-150">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D2DCE8] dark:divide-[#222228]">
          {/* KPI 1: System Integrity Status */}
          <div className="p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              System Integrity Status
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isCompromised ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                }`}
              ></span>
              <span
                className={`text-sm font-semibold tracking-tight ${
                  isCompromised
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {isCompromised ? 'Tamper Discrepancy' : 'All Batches Verified'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
              {isCompromised ? 'Pinpoint forensic audit triggered' : 'Continuous SHA-256 hash chain'}
            </span>
          </div>

          {/* KPI 2: Anchored Batches */}
          <div className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Anchored Batches
              </span>
              <Layers size={14} strokeWidth={1.75} />
            </div>
            <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {totalBatches}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
              Anchored on Hardhat EVM (10s TTL)
            </span>
          </div>

          {/* KPI 3: Watchtower Heartbeat */}
          <div className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Watchtower Heartbeat
              </span>
              <Activity size={14} strokeWidth={1.75} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAgentKilled ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              ></span>
              <span
                className={`text-sm font-semibold font-mono ${
                  isAgentKilled
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {isAgentKilled ? 'WATCHTOWER OFFLINE' : 'HEARTBEAT OK'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
              15s Dead Man's Switch threshold
            </span>
          </div>

          {/* KPI 4: CERT-In 180-Day / 6-Hour Compliance */}
          <div className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                CERT-In Compliance
              </span>
              <Database size={14} strokeWidth={1.75} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isCompromised ? (
                <span className="font-mono font-bold text-base tabular-nums text-rose-700 dark:text-rose-400">
                  {countdownDisplay}
                </span>
              ) : (
                <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                  180-Day Retained
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
              {isCompromised ? 'Mandatory reporting window active' : `${totalLogs} sealed vault logs retained`}
            </span>
          </div>
        </div>
      </div>

      {/* Normal State: Executive Assurance Banner when integrity is intact */}
      {!isCompromised && (
        <div className="bg-[#F4F7FA] dark:bg-[#111114] border border-[#D2DCE8] dark:border-[#222228] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} strokeWidth={1.75} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                All security batches match on-chain Merkle roots in <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">LogAnchor.sol</code>.
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-500 ml-2 hidden md:inline">
                Zero tamper discrepancies detected across disk and vault backups.
              </span>
            </div>
          </div>

          {anchors.length > 0 && (
            <button
              onClick={() => handleExportEvidence(targetBatchId)}
              className="self-start sm:self-auto rounded-md border border-[#D2DCE8] dark:border-[#222228] bg-[#E2E9F2] hover:bg-[#D2DCE8] dark:bg-[#16161A] dark:hover:bg-[#1F1F24] text-slate-700 dark:text-zinc-300 text-xs font-medium px-3 py-1.5 inline-flex items-center gap-1.5 transition active:scale-95"
            >
              <Download size={13} strokeWidth={1.75} />
              Export BSA Sec 63 Proof
            </button>
          )}
        </div>
      )}

      {/* Attack State: Clinical, Authoritative Alert Card with GitHub PR-style Diff */}
      {isCompromised && (
        <div className="bg-[#F4F7FA] dark:bg-[#111114] border border-rose-300 dark:border-rose-900/60 rounded-lg p-5 shadow-sm space-y-4 transition-all duration-150">
          {/* Clinical Alert Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D2DCE8] dark:border-[#222228]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle size={16} strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Forensic Discrepancy Pinpointed
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    TAMPER DETECTED
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  On-chain Merkle root does not match disk logs. Red team activity isolated by forensic engine.
                </p>
              </div>
            </div>

            {/* Actions: CERT-In Countdown & Executive Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 6-Hour Countdown */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#E2E9F2] dark:bg-[#16161A] border border-[#D2DCE8] dark:border-[#222228]">
                <Clock size={14} strokeWidth={1.75} className="text-rose-600 dark:text-rose-400" />
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium uppercase tracking-wider leading-none">
                    CERT-In Reporting
                  </span>
                  <span className="font-mono font-bold text-xs tabular-nums text-rose-700 dark:text-rose-400">
                    {countdownDisplay}
                  </span>
                </div>
              </div>

              {/* 1-Click Recover Logs */}
              <button
                onClick={handleRecoverAll}
                disabled={recovering}
                className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={13} strokeWidth={1.75} className={recovering ? 'animate-spin' : ''} />
                {recovering ? 'Restoring...' : 'Recover Logs'}
              </button>

              {/* Export BSA Sec 63 Proof */}
              <button
                onClick={() => handleExportEvidence(targetBatchId)}
                className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 transition active:scale-95"
              >
                <FileText size={13} strokeWidth={1.75} />
                Export BSA Sec 63 Proof
              </button>

              {/* Resume Heartbeat if Agent Killed */}
              {isAgentKilled && (
                <button
                  onClick={handleUnkillAgent}
                  className="rounded-md border border-[#D2DCE8] dark:border-[#222228] bg-[#E2E9F2] hover:bg-[#D2DCE8] dark:bg-[#16161A] dark:hover:bg-[#1F1F24] text-slate-800 dark:text-zinc-200 font-medium text-xs px-3 py-1.5 inline-flex items-center gap-1.5 transition active:scale-95"
                >
                  <Play size={13} strokeWidth={1.75} className="text-emerald-600 dark:text-emerald-400" />
                  Resume Heartbeat
                </button>
              )}
            </div>
          </div>

          {recoverMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs px-3 py-2 rounded-md flex items-center gap-2">
              <CheckCircle2 size={15} strokeWidth={1.75} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{recoverMsg}</span>
            </div>
          )}

          {/* Watchtower Dead Man's Switch tripped alert */}
          {isAgentKilled && (
            <div className="p-3 rounded-md bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Skull size={15} strokeWidth={1.75} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <span className="font-semibold text-rose-900 dark:text-rose-300">
                    Dead Man's Switch Tripped:{' '}
                  </span>
                  <span className="text-slate-700 dark:text-zinc-300">
                    Agent heartbeat suppressed. Detected at{' '}
                    <span className="font-mono text-amber-700 dark:text-amber-300 font-medium">
                      {dms?.killed_timestamp}
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60 shrink-0">
                {dms?.display_status || 'HEARTBEAT HALTED'}
              </span>
            </div>
          )}

          {/* Side-by-Side Pinpoint Diff: Styled like a GitHub Pull Request diff */}
          {tamperAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 font-medium">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Pinpoint Discrepancy Audit (Line-by-Line Forensic Diff)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
                  Batch #{tamperAlerts[0]?.batch_id} · {tamperAlerts[0]?.detected_at}
                </span>
              </div>

              {tamperAlerts.map((alert: any) => (
                <div
                  key={alert.batch_id}
                  className="rounded-lg border border-[#D2DCE8] dark:border-[#222228] bg-[#E2E9F2] dark:bg-[#0E0E12] overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#D2DCE8] dark:divide-[#222228] text-xs">
                    {/* Left: Tampered Disk Log (PR Diff Red: -) */}
                    <div className="flex flex-col">
                      <div className="bg-rose-100/60 dark:bg-rose-950/30 px-3.5 py-2 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-[11px] font-semibold font-mono text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        <span>- TAMPERED DISK LOG (data/server.log)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-900/50">MODIFIED</span>
                      </div>

                      <div className="p-2 space-y-1.5 flex-1">
                        {alert.mismatches && alert.mismatches.length > 0 ? (
                          alert.mismatches.map((m: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 font-mono text-xs text-rose-900 dark:text-rose-200"
                            >
                              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold select-none w-16 shrink-0 tabular-nums">
                                L{m.global_line_index} -
                              </span>
                              <div className="flex-1 break-all select-all font-mono">
                                {m.current_text}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-rose-700 dark:text-rose-400/80 font-mono text-xs italic">
                            File completely truncated or zeroed (0 bytes).
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Cryptographically Proven Vault Original (PR Diff Green: +) */}
                    <div className="flex flex-col">
                      <div className="bg-emerald-100/60 dark:bg-emerald-950/30 px-3.5 py-2 border-b border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-[11px] font-semibold font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        <span>+ CRYPTOGRAPHICALLY PROVEN (AES-256-GCM VAULT)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/50">AUTHENTIC</span>
                      </div>

                      <div className="p-2 space-y-1.5 flex-1">
                        {alert.mismatches && alert.mismatches.length > 0 ? (
                          alert.mismatches.map((m: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 font-mono text-xs text-emerald-900 dark:text-emerald-200"
                            >
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold select-none w-16 shrink-0 tabular-nums">
                                L{m.global_line_index} +
                              </span>
                              <div className="flex-1 break-all select-all font-mono">
                                {m.original_text}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-emerald-700 dark:text-emerald-400/80 font-mono text-xs italic">
                            Original logs preserved in encrypted vault. Ready for 1-click recovery.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
