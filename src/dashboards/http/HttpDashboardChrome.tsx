import React, { useEffect, useState } from 'react';
import { InlineSwitch, Stack } from '@grafana/ui';
import { CheckDashboardHeader } from 'dashboards/components/CheckDashboardHeader';
import { httpDashboardHeaderProfile } from 'dashboards/http/header/httpDashboardHeaderProfile';
import { trackCheckDashboardViewed } from 'features/tracking/checkDashboardEvents';

import { CheckType, HTTPCheck } from 'types';
import { useCheckUptimeSuccessRate } from 'data/useSuccessRates';
import { EditCheckButton } from 'scenes/Common/EditCheckButton';

export function HttpDashboardHeader({
  check,
}: {
  check: HTTPCheck;
}) {
  return (
    <CheckDashboardHeader
      actions={<EditCheckButton id={check.id} />}
      check={check}
      profile={httpDashboardHeaderProfile}
    />
  );
}

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
    <Stack direction="column" gap={2}>
      <HttpDashboardHeader check={check} />
      {children}
    </Stack>
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
