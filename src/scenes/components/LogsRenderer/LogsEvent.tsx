import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { UnknownParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { LogLine } from 'scenes/components/LogsRenderer/LogLine';

export const LogsEvent = <T extends UnknownParsedLokiRecord>({ logs, mainKey }: { logs: T[]; mainKey: string }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.timelineContainer}>
      {logs.map((log) => (
        <LogLine key={log.id} log={log} mainKey={mainKey} />
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
