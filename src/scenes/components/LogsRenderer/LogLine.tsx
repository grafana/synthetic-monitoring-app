import React, { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { HTTPResponseTimingsLog } from 'features/parseCheckLogs/checkLogs.types.http';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { useTracesDS } from 'hooks/useTracesDS';
import { LogHTTPResponseTimings } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings';
import { fetchTraceData } from 'scenes/components/LogsRenderer/LogLine.utils';
import { TRACE_ID_LABEL_NAMES } from 'scenes/components/LogsRenderer/TraceLink.constants';
import { TracePanel } from 'scenes/components/LogsRenderer/TracePanel';
import { UniqueLogLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels';

interface LogLineProps {
  log: ParsedLokiRecord<Record<string, string>, Record<string, string>>;
  mainKey: string;
}

export const LogLine = ({ log, mainKey }: LogLineProps) => {
  const styles = useStyles2(getStyles);
  const tracesDS = useTracesDS();
  const [expanded, setExpanded] = useState(false);

  const labels = log.labels as Record<string, string>;
  const traceId = getTraceId(labels);
  const level = labels.detected_level;

  const {
    data: traceData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['trace', traceId, tracesDS, log[LokiFieldNames.TimeStamp]],
    queryFn: () => fetchTraceData(traceId!, tracesDS!, log[LokiFieldNames.TimeStamp]),
    enabled: !!traceId && !!tracesDS,
  });

  const traceExists = traceData && traceData.series.length > 0;

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setExpanded(false);
  }, []);

  return (
    <div data-testid={`event-log-${log.id}`}>
      <div className={styles.timelineItem}>
        <div className={styles.time}>{dateTimeFormat(log[LokiFieldNames.TimeStamp], { defaultWithMS: true })}</div>
        <div
          className={cx(styles.level, {
            [styles.error]: level === 'error',
            [styles.info]: level === 'info',
            [styles.warning]: level === 'warn',
          })}
        >
          {level.toUpperCase()}
        </div>
        <div className={styles.mainKey}>{labels[mainKey]}</div>
        <LabelRenderer
          log={log}
          mainKey={mainKey}
          expanded={expanded}
          onToggle={handleToggle}
          traceExists={traceExists}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />
      </div>
      {expanded && tracesDS && traceData && traceExists && (
        <TracePanel traceId={traceId!} tracesDS={tracesDS} traceData={traceData} onClose={handleClose} />
      )}
    </div>
  );
};

function getTraceId(labels: Record<string, string>): string | undefined {
  for (const labelName of TRACE_ID_LABEL_NAMES) {
    if (labels[labelName]) {
      return labels[labelName];
    }
  }
  return undefined;
}

const MSG_MAP = {
  [MSG_STRINGS_HTTP.ResponseTimings]: LogHTTPResponseTimings,
};

const LabelRenderer = ({
  log,
  mainKey,
  expanded,
  onToggle,
  traceExists,
  isLoading,
  isError,
  onRetry,
}: {
  log: ParsedLokiRecord<Record<string, string>, Record<string, string>>;
  mainKey: string;
  expanded: boolean;
  onToggle: () => void;
  traceExists?: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) => {
  const Component = MSG_MAP[log.labels[mainKey]];

  if (Component) {
    return <Component log={log as unknown as HTTPResponseTimingsLog} />;
  }

  return (
    <UniqueLogLabels
      log={log}
      expanded={expanded}
      onToggle={onToggle}
      traceExists={traceExists}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timelineItem: css`
    display: grid;
    grid-template-columns: 210px 65px 3fr minmax(300px, 2fr);
    align-items: center;
    gap: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.medium};
    padding: ${theme.spacing(0.5)};
  `,
  mainKey: css`
    overflow-x: auto;
  `,
  time: css`
    color: ${theme.colors.text.secondary};
  `,
  level: css`
    color: ${theme.colors.text.secondary};
    font-family: ${theme.typography.fontFamilyMonospace};
  `,
  error: css`
    color: ${theme.colors.error.text};
  `,
  info: css`
    color: ${theme.colors.info.text};
  `,
  warning: css`
    color: ${theme.colors.warning.text};
  `,
});
