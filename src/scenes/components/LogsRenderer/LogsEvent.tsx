import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { LokiFieldNames, UnknownParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { LogLine } from 'scenes/components/LogsRenderer/LogLine';
import { TRACE_ID_LABEL_NAMES } from 'scenes/components/LogsRenderer/TraceLink.constants';

export const LogsEvent = <T extends UnknownParsedLokiRecord>({ logs, mainKey }: { logs: T[]; mainKey: string }) => {
  const styles = useStyles2(getStyles);

  const hasTraceColumn = useMemo(
    () =>
      logs.some((log) => {
        const labels = log[LokiFieldNames.Labels] as Record<string, string>;
        return [...TRACE_ID_LABEL_NAMES].some((name) => !!labels[name]);
      }),
    [logs]
  );

  return (
    <div className={styles.timelineContainer}>
      {logs.map((log) => (
        <LogLine key={log.id} log={log} mainKey={mainKey} hasTraceColumn={hasTraceColumn} />
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timelineContainer: css`
    position: relative;
    height: 100%;
    width: 100%;
    font-family: ${theme.typography.fontFamilyMonospace};
    overflow-x: auto;
  `,
});
