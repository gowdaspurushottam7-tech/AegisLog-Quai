import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, AlertOctagon, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CertInBarProps {
  statusData: any;
}

export const CertInBar: React.FC<CertInBarProps> = ({ statusData }) => {
  const [liveTimeIst, setLiveTimeIst] = useState<string>('');
  const [liveTimeUtc, setLiveTimeUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // IST is UTC+5:30
      const utcTime = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const istTime = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now) + ' IST';

      setLiveTimeIst(istTime);
      setLiveTimeUtc(utcTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const countdown = statusData?.incident_countdown;
  const isCountdownActive = countdown?.countdown_active || statusData?.is_compromised;
  const countdownDisplay = countdown?.countdown_display || '06:00:00';

  return (
    <div className="bg-[#0B132B] border-b border-slate-800 text-xs py-2.5 px-4 sm:px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: CERT-In Branding & Clock */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-blue-950/70 border border-blue-800/60 px-2.5 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-blue-300 tracking-wider">CERT-In COMPLIANT</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">NTP Synced:</span>
            <span className="text-emerald-400 font-medium">{liveTimeIst || statusData?.timestamp_ist || 'Loading...'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono">{liveTimeUtc}</span>
          </div>
        </div>

        {/* Right: Retention Badge & Incident Reporting Countdown Timer */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 180-Day Retention Badge */}
          <div className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 px-3 py-1 rounded">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">180-Day Retention Active</span>
            <span className="bg-emerald-900/80 text-[10px] px-1.5 py-0.5 rounded text-emerald-200 ml-1">
              {statusData?.cert_in_retention?.batches_stored ?? 0} Batches Stored
            </span>
          </div>

          {/* 6-Hour Incident Reporting Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
              isCountdownActive
                ? 'bg-red-950/80 border-red-600 text-red-200 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400'
            }`}
          >
            <AlertOctagon className={`w-3.5 h-3.5 ${isCountdownActive ? 'text-red-400 animate-spin' : 'text-slate-500'}`} />
            <div>
              <span className="text-[10px] block uppercase font-bold tracking-wider leading-none">
                {isCountdownActive ? 'CRITICAL: CERT-In Reporting Window' : 'CERT-In Incident Timer'}
              </span>
              <span className="font-mono font-bold text-sm tracking-widest text-red-400">
                {countdownDisplay}
              </span>
            </div>
            {isCountdownActive && (
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                ATTACK ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
