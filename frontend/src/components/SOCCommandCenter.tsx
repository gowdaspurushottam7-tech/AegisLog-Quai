import React from 'react';
import { TamperPanel } from './TamperPanel';
import { RedTeamPanel } from './RedTeamPanel';
import { LiveLogViewer } from './LiveLogViewer';
import { ShieldCheck, HardDrive, Layers, Activity, Lock, Cpu } from 'lucide-react';

interface SOCCommandCenterProps {
  statusData: any;
  onRefresh: () => void;
}

export const SOCCommandCenter: React.FC<SOCCommandCenterProps> = ({ statusData, onRefresh }) => {
  const anchors = statusData?.anchors || [];
  const logs = statusData?.live_logs || [];
  const dms = statusData?.dead_man_switch;
  const isAgentKilled = dms?.AGENT_KILLED_ALERT;

  const totalLogs = statusData?.cert_in_retention?.total_logs_stored || logs.length;
  const totalBatches = anchors.length;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: On-Chain Batches */}
        <div className="bg-[#0D1526] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Anchored Batches</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{totalBatches}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">10s Interval</span> · Hardhat Chain 31337
          </div>
        </div>

        {/* Card 2: Total Logs Ingested */}
        <div className="bg-[#0D1526] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sealed Logs</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{totalLogs}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-400 font-medium">100% Retained</span> (CERT-In 180 Days)
          </div>
        </div>

        {/* Card 3: Cryptographic Cipher */}
        <div className="bg-[#0D1526] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Vault Encryption</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-amber-300">AES-256-GCM</div>
          <div className="text-[11px] text-slate-500 mt-1">
            128-bit AEAD Tag + Isolated Vault
          </div>
        </div>

        {/* Card 4: Dead Man's Switch Watchtower */}
        <div className="bg-[#0D1526] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Watchtower Health</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isAgentKilled ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
              }`}
            ></span>
            <span
              className={`text-base font-bold font-mono ${
                isAgentKilled ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isAgentKilled ? 'AGENT KILLED' : 'HEARTBEAT OK'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            15s Kill Trigger · Auto CERT-In Alarm
          </div>
        </div>
      </div>

      {/* Critical Tamper & Recovery Alert Panel */}
      <TamperPanel statusData={statusData} onRefresh={onRefresh} />

      {/* Red Team Attack Simulator */}
      <RedTeamPanel onAttackTriggered={onRefresh} />

      {/* Live Streaming Log Viewer */}
      <LiveLogViewer logs={logs} anchors={anchors} />
    </div>
  );
};
