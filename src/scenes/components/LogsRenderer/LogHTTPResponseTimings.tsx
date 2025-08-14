import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { HTTPResponseTimings } from 'features/parseCheckLogs/checkLogs.types.http';
import { formatSmallDurations } from 'utils';
import { getTiming } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings.utils';

const HTTP_REQUEST_ORDER = [`resolve`, `connect`, `tls`, `processing`, `transfer`] as const;

const TIMING_CALCULATIONS = {
  resolve: [`start`, `dnsDone`],
  connect: [`dnsDone`, `connectDone`],
  tls: [`tlsStart`, `tlsDone`],
  processing: [`gotConn`, `responseStart`],
  transfer: [`responseStart`, `end`],
} as const;

export const LogHTTPResponseTimings = ({ log }: { log: HTTPResponseTimings }) => {
  const styles = useStyles2(getStyles);

  const timings = HTTP_REQUEST_ORDER.map((key) => {
    const [start, end] = TIMING_CALCULATIONS[key];
    const timing = getTiming(log.labels[start], log.labels[end]);

    if (!Number.isNaN(timing)) {
      return timing;
    }

    return -1;
  });

  const totalTiming = timings.filter((timing) => timing > 0).reduce((acc, timing) => acc + timing, 0);

  if (totalTiming === 0) {
    return <div>Request was aborted.</div>;
  }

  return (
    <div>
      {timings.map((timing, index) => {
        const key = HTTP_REQUEST_ORDER[index];

        if (timing > 0) {
          return (
            <div key={HTTP_REQUEST_ORDER[index]}>
              {key}: {formatSmallDurations(timing)}
            </div>
          );
        }

        return null;
      })}
      <div className={styles.total}>Total: {formatSmallDurations(totalTiming)}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    total: css`
      display: inline-block;
      border-top: 1px solid ${theme.colors.border.medium};
      padding-top: ${theme.spacing(0.5)};
      margin-top: ${theme.spacing(0.5)};
    `,
  };
};
