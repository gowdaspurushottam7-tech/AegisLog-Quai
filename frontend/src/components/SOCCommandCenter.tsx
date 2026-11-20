import React from 'react';
import { TamperPanel } from './TamperPanel';
import { RedTeamPanel } from './RedTeamPanel';
import { LiveLogViewer } from './LiveLogViewer';

interface SOCCommandCenterProps {
  statusData: any;
  onRefresh: () => void;
}

export const SOCCommandCenter: React.FC<SOCCommandCenterProps> = ({ statusData, onRefresh }) => {
  const anchors = statusData?.anchors || [];
  const logs = statusData?.live_logs || [];

  return (
    <div className="space-y-5">
      {/* Progressive Disclosure Hero Card (Normal Calm Green Banner / Attack Alert Diff) */}
      <TamperPanel statusData={statusData} onRefresh={onRefresh} />

      {/* Sleek Red Team Bar (Horizontal Toolbar right above log feed) */}
      <RedTeamPanel onAttackTriggered={onRefresh} />

      {/* Clean Minimalist Streaming Log Feed */}
      <LiveLogViewer logs={logs} anchors={anchors} />
    </div>
  );
};
