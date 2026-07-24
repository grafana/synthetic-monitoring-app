import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import { GrafanaTheme2, intervalToAbbreviatedDurationString, TimeRange } from '@grafana/data';
import { Button, Field, MultiCombobox, RefreshPicker, TimeRangePicker, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useAppTime } from 'contexts/AppTimeProvider';
import {
  canShiftTimeRangeForward,
  DEFAULT_APP_TIME_RANGE,
  getDefaultRefreshInterval,
  resolveTimeRange,
} from 'contexts/AppTimeProvider.utils';
import { useCheckDashboardOptional } from 'contexts/CheckDashboardProvider';
import { useDashboardPanelScope } from 'contexts/DashboardPanelScopeProvider';

import { DashboardComparisonControls } from './DashboardComparisonControls';

const PROBE_CONTROL_ID = 'dashboard-probe-control';

function toRawTimeValue(value: TimeRange['raw']['from']): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function DashboardProbeControl() {
  const styles = useStyles2(getStyles);
  const { probes, setProbes, catalogLoading, catalog, catalogError } = useDashboardPanelScope();
  const options = useMemo(() => catalog.map((probe) => ({ label: probe, value: probe })), [catalog]);

  if (catalogError) {
    return null;
  }

  return (
    <Field className={styles.probeField} htmlFor={PROBE_CONTROL_ID} label="Probes">
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
    </Field>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  globalControls: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    justifyContent: 'space-between',
    width: '100%',
  }),
  startGroup: css({
    alignItems: 'flex-start',
    display: 'flex',
    flex: '0 0 auto',
    justifyContent: 'flex-start',
    minWidth: 0,
  }),
  endGroup: css({
    alignItems: 'center',
    display: 'flex',
    flex: '0 0 auto',
    flexWrap: 'nowrap',
    gap: theme.spacing(1),
    justifyContent: 'flex-end',
    minWidth: 0,
  }),
  panelFilters: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    justifyContent: 'flex-start',
    width: '100%',
  }),
  probeField: css({
    marginBottom: 0,
  }),
});

function DashboardTimeRangeControl() {
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
  const checkDashboard = useCheckDashboardOptional();
  const check = checkDashboard?.check;
  const initializedCheckId = useRef<number | undefined>(undefined);

  // Auto-refresh is on by default, using an interval derived from how often the
  // check runs. We seed it once per check when the user hasn't chosen a refresh
  // interval, so turning it off (or picking another value) is respected.
  useEffect(() => {
    if (!check || initializedCheckId.current === check.id) {
      return;
    }

    initializedCheckId.current = check.id;

    if (appTime.refresh === undefined) {
      appTime.setRefresh(getDefaultRefreshInterval(check.frequency));
    }
  }, [appTime, check]);

  if (appTime.rangeMode === 'historical') {
    return (
      <Button
        fill="outline"
        onClick={() => appTime.setTimeRange(DEFAULT_APP_TIME_RANGE)}
        type="button"
        variant="secondary"
      >
        Go to now
      </Button>
    );
  }

  return (
    <RefreshPicker
      isOnCanvas
      value={appTime.refresh}
      onRefresh={appTime.refreshNow}
      onIntervalChanged={(interval) => appTime.setRefresh(interval || undefined)}
    />
  );
}

export function DashboardTimeControls() {
  const styles = useStyles2(getStyles);

  return (
    <div aria-label="Dashboard controls" className={styles.globalControls}>
      <div className={styles.startGroup} data-testid="dashboard-start-group">
        <DashboardComparisonControls />
      </div>
      <div className={styles.endGroup} data-testid="dashboard-end-group" style={{ marginLeft: 'auto' }}>
        <DashboardTimeRangeControl />
        <DashboardRefreshControl />
      </div>
    </div>
  );
}

function DashboardClearFiltersControl() {
  const { probes, setProbes } = useDashboardPanelScope();

  if (probes.length === 0) {
    return null;
  }

  return (
    <Button fill="text" onClick={() => setProbes([])} type="button" variant="secondary">
      Clear filters
    </Button>
  );
}

export function DashboardPanelScopeControls({ filters }: { filters?: ReactNode }) {
  const styles = useStyles2(getStyles);

  return (
    <div aria-label="Panel filters" className={styles.panelFilters}>
      <DashboardProbeControl />
      {filters}
      <DashboardClearFiltersControl />
    </div>
  );
}
