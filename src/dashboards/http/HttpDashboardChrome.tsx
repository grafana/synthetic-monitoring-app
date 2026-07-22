import React, { useEffect, useState } from 'react';
import { InlineSwitch } from '@grafana/ui';
import { CheckDashboardLayout } from 'dashboards/components/CheckDashboardHeader';
import { httpDashboardHeaderProfile } from 'dashboards/http/header/httpDashboardHeaderProfile';
import { trackCheckDashboardViewed } from 'features/tracking/checkDashboardEvents';

import { CheckType, HTTPCheck } from 'types';
import { useCheckUptimeSuccessRate } from 'data/useSuccessRates';
import { EditCheckButton } from 'scenes/Common/EditCheckButton';

function useTrackCheckDashboardViewed(check: HTTPCheck) {
  const { data: uptime, isSuccess, isError } = useCheckUptimeSuccessRate(check);

  useEffect(() => {
    if (!isSuccess && !isError) {
      return;
    }

    trackCheckDashboardViewed({
      checkType: CheckType.Http,
      hasFailures: typeof uptime === 'number' ? uptime < 1 : undefined,
      uptime: typeof uptime === 'number' ? Math.round(uptime * 10000) / 100 : undefined,
    });
  }, [check.id, isError, isSuccess, uptime]);
}

export function HttpDashboardPage({
  check,
  children,
}: {
  check: HTTPCheck;
  children: React.ReactNode;
}) {
  useTrackCheckDashboardViewed(check);

  return (
    <CheckDashboardLayout
      actions={<EditCheckButton id={check.id} />}
      check={check}
      profile={httpDashboardHeaderProfile}
    >
      {children}
    </CheckDashboardLayout>
  );
}

export function ErrorLogsPanelHeaderActions({
  unsuccessfulOnly,
  onToggle,
}: {
  unsuccessfulOnly: boolean;
  onToggle: () => void;
}) {
  return (
    <InlineSwitch
      label="Unsuccessful runs only"
      transparent
      showLabel
      value={unsuccessfulOnly}
      onChange={onToggle}
    />
  );
}

export function useErrorLogsPanelState(startingUnsuccessfulOnly = false) {
  const [unsuccessfulOnly, setUnsuccessfulOnly] = useState(startingUnsuccessfulOnly);

  return {
    unsuccessfulOnly,
    toggleUnsuccessfulOnly: () => setUnsuccessfulOnly((current) => !current),
  };
}
