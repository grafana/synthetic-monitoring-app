import React, { useMemo } from 'react';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import { MultiCombobox, RefreshPicker, Stack, TimeRangePicker, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useAppTime } from 'contexts/AppTimeProvider';
import { resolveTimeRange } from 'contexts/AppTimeProvider.utils';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';

const PROBE_CONTROL_ID = 'dashboard-probe-control';

function toRawTimeValue(value: TimeRange['raw']['from']): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function DashboardProbeControl() {
  const styles = useStyles2(getStyles);
  const { probes, setProbes, catalogLoading, catalog, catalogError } = useCheckDashboard();
  const options = useMemo(() => catalog.map((probe) => ({ label: probe, value: probe })), [catalog]);

  if (catalogError) {
    return null;
  }

  return (
    <>
      <label className={styles.visuallyHidden} htmlFor={PROBE_CONTROL_ID}>
        Probes
      </label>
      <MultiCombobox
        id={PROBE_CONTROL_ID}
        isClearable
        loading={catalogLoading}
        maxWidth={64}
        minWidth={40}
        options={options}
        value={probes}
        width="auto"
        onChange={(values) => setProbes(values.map((entry) => entry.value))}
        placeholder="All probes"
      />
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  visuallyHidden: css({
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: theme.spacing(0.125),
    margin: theme.spacing(-0.125),
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: theme.spacing(0.125),
  }),
});

function DashboardTimeControls() {
  const appTime = useAppTime();
  const value = useMemo(
    () => resolveTimeRange(appTime.raw.from, appTime.raw.to),
    [appTime.raw.from, appTime.raw.to]
  );

  return (
    <Stack alignItems="center" gap={1}>
      <TimeRangePicker
        isOnCanvas
        value={value}
        timeZone={appTime.timezone}
        onChange={(range) =>
          appTime.setTimeRange({
            from: toRawTimeValue(range.raw.from),
            to: toRawTimeValue(range.raw.to),
          })
        }
        onChangeTimeZone={() => undefined}
        onMoveBackward={() => undefined}
        onMoveForward={() => undefined}
        onZoom={() => undefined}
      />
      <RefreshPicker
        isOnCanvas
        value={appTime.refresh}
        onRefresh={appTime.refreshNow}
        onIntervalChanged={(interval) => appTime.setRefresh(interval || undefined)}
      />
    </Stack>
  );
}

export function DashboardScopeControls() {
  return (
    <div aria-label="Dashboard scope controls">
      <Stack alignItems="center" justifyContent="space-between" gap={2} wrap="wrap">
        <DashboardProbeControl />
        <DashboardTimeControls />
      </Stack>
    </div>
  );
}
