import React, { useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, InlineSwitch, MultiSelect, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackCheckDashboardViewed } from 'features/tracking/checkDashboardEvents';

import { Check, CheckType } from 'types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';
import { useCheckUptimeSuccessRate } from 'data/useSuccessRates';
import { EditCheckButton } from 'scenes/Common/EditCheckButton';

function HttpDashboardTimeControls() {
  const appTime = useAppTime();

  return (
    <Stack alignItems="center" gap={1}>
      <Button
        aria-label="Refresh dashboard"
        icon="sync"
        variant="secondary"
        onClick={() => appTime.refreshNow()}
      />
      <span>{`${appTime.raw.from} to ${appTime.raw.to}`}</span>
    </Stack>
  );
}

function HttpDashboardProbeControl() {
  const { probes, setProbes, catalogLoading, catalog, catalogError } = useCheckDashboard();
  const options = useMemo(
    () => catalog.map((probe) => ({ label: probe, value: probe })),
    [catalog]
  );
  const value = useMemo(
    () => probes.map((probe) => ({ label: probe, value: probe })),
    [probes]
  );

  if (catalogError) {
    return null;
  }

  return (
    // MultiSelect matches legacy probe picker behaviour; migrate to Combobox when chrome parity is tightened.
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- intentional interim probe control
    <MultiSelect
      aria-label="probe"
      isLoading={catalogLoading}
      options={options}
      value={value}
      onChange={(values) => setProbes(values.map((entry) => entry.value!))}
      placeholder="All probes"
    />
  );
}

export function HttpDashboardHeader({ check }: { check: Check }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.variableControls}>
          <HttpDashboardProbeControl />
        </div>
        <div className={styles.actions}>
          <EditCheckButton id={check.id} />
          <div className={styles.dashboardControls}>
            <HttpDashboardTimeControls />
          </div>
        </div>
      </div>
    </div>
  );
}

function useTrackCheckDashboardViewed(check: Check) {
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
  check: Check;
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

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    container-type: inline-size;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.spacing(1)};
  `,
  variableControls: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
  `,
  actions: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
  `,
  dashboardControls: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
});

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
