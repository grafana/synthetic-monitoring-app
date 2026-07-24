import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useAppTime } from 'contexts/AppTimeProvider';
import { DEFAULT_APP_TIME_RANGE } from 'contexts/AppTimeProvider.utils';

import { CHECK_DASHBOARD_PAGE_GUTTER } from './CheckDashboardLayout.constants';
import { useCheckHealth } from './health/CheckHealthContext';

export function LiveIncidentPrompt() {
  const styles = useStyles2(getStyles);
  const { liveIncidentCount } = useCheckHealth();
  const { rangeMode, setTimeRange } = useAppTime();

  if (liveIncidentCount === 0 || rangeMode !== 'historical') {
    return null;
  }

  return (
    <div aria-label="Current incident" className={styles.prompt} role="status">
      <span>
        {liveIncidentCount === 1
          ? 'An alert is firing now'
          : `${liveIncidentCount} alerts are firing now`}
      </span>
      <button
        className={styles.linkButton}
        onClick={() => setTimeRange(DEFAULT_APP_TIME_RANGE)}
        type="button"
      >
        View current activity
      </button>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  prompt: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.5, 1),
    padding: theme.spacing(0.75, CHECK_DASHBOARD_PAGE_GUTTER),
  }),
  linkButton: css({
    background: 'transparent',
    border: 0,
    color: theme.colors.text.link,
    cursor: 'pointer',
    fontSize: 'inherit',
    padding: 0,
  }),
});
