import React, { ReactNode, useMemo } from 'react';
import { GrafanaTheme2, intervalToAbbreviatedDurationString, TimeRange } from '@grafana/data';
import { MultiCombobox, RefreshPicker, TimeRangePicker, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useAppTime } from 'contexts/AppTimeProvider';
import { canShiftTimeRangeForward, resolveTimeRange } from 'contexts/AppTimeProvider.utils';
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
    <div>
      <label className={styles.visuallyHidden} htmlFor={PROBE_CONTROL_ID}>
        Probes
      </label>
      <MultiCombobox
        id={PROBE_CONTROL_ID}
        isClearable
        loading={catalogLoading}
        maxWidth={32}
        minWidth={24}
        options={options}
        value={probes}
        width="auto"
        onChange={(values) => setProbes(values.map((entry) => entry.value))}
        placeholder="All probes"
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  commandBar: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    justifyContent: 'space-between',
  }),
  commandGroup: css({
    alignItems: 'center',
    display: 'flex',
    flex: '0 0 auto',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
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
    () => resolveTimeRange(appTime.raw.from, appTime.raw.to, appTime.timezone),
    [appTime.raw.from, appTime.raw.to, appTime.timezone]
  );
  const halfSpanMs = (value.to.valueOf() - value.from.valueOf()) / 2;
  const moveDuration = intervalToAbbreviatedDurationString({
    start: new Date(value.from.valueOf()),
    end: new Date(value.from.valueOf() + halfSpanMs),
  });
  const canMoveForward = canShiftTimeRangeForward(value);

  return (
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
      onChangeTimeZone={appTime.setTimezone}
      onMoveBackward={appTime.shiftBackward}
      onMoveForward={appTime.shiftForward}
      moveBackwardTooltip={`Move ${moveDuration} backward`}
      moveForwardTooltip={canMoveForward ? `Move ${moveDuration} forward` : undefined}
      onZoom={appTime.zoomOut}
    />
  );
}

function DashboardRefreshControl() {
  const appTime = useAppTime();

  return (
    <RefreshPicker
      isOnCanvas
      value={appTime.refresh}
      onRefresh={appTime.refreshNow}
      onIntervalChanged={(interval) => appTime.setRefresh(interval || undefined)}
    />
  );
}

export function DashboardScopeControls({ filters }: { filters?: ReactNode }) {
  const styles = useStyles2(getStyles);

  return (
    <div aria-label="Dashboard scope controls" className={styles.commandBar}>
      <div className={styles.commandGroup} data-testid="command-bar-group">
        <DashboardProbeControl />
        {filters}
      </div>
      <div className={styles.commandGroup} data-testid="command-bar-group">
        <DashboardTimeControls />
        <DashboardRefreshControl />
      </div>
    </div>
  );
}
