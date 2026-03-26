import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { TraceIconButton } from 'scenes/components/LogsRenderer/TraceIconButton';
import { TRACE_ID_LABEL_NAMES } from 'scenes/components/LogsRenderer/TraceLink.constants';
import { TracePanel } from 'scenes/components/LogsRenderer/TracePanel';
import { UniqueLogLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels';

import { PROPAGATION_POLL_MS, PROPAGATION_WINDOW_MS } from './LogLine.constants';

interface LogLineProps {
  log: ParsedLokiRecord<Record<string, string>, Record<string, string>>;
  mainKey: string;
  hasTraceColumn: boolean;
}

export const LogLine = ({ log, mainKey, hasTraceColumn }: LogLineProps) => {
  const styles = useStyles2(getStyles);
  const tracesDS = useTracesDS();
  const [expanded, setExpanded] = useState(false);
  const [, forceUpdate] = useState(0);
  const traceIconRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [arrowOffset, setArrowOffset] = useState<number | null>(null);

  const labels = log.labels as Record<string, string>;
  const traceId = getTraceId(labels);
  const level = labels.detected_level;
  const logTimestamp = log[LokiFieldNames.TimeStamp];

  const {
    data: traceData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['trace', traceId, tracesDS, logTimestamp],
    queryFn: () => fetchTraceData(traceId!, tracesDS!, logTimestamp),
    enabled: !!traceId && !!tracesDS,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.series.length > 0) {
        return false;
      }
      if (Date.now() - logTimestamp < PROPAGATION_WINDOW_MS) {
        return PROPAGATION_POLL_MS;
      }
      return false;
    },
  });

  const traceExists = Boolean(traceData && traceData.series.length > 0);
  const isRecent = Date.now() - logTimestamp < PROPAGATION_WINDOW_MS;
  const isAwaitingPropagation = !traceExists && !isLoading && isRecent && !!traceId && !!tracesDS;

  useEffect(() => {
    if (!isAwaitingPropagation) {
      return;
    }
    const remaining = PROPAGATION_WINDOW_MS - (Date.now() - logTimestamp);
    if (remaining <= 0) {
      return;
    }
    const timer = setTimeout(() => forceUpdate((n) => n + 1), remaining);
    return () => clearTimeout(timer);
  }, [isAwaitingPropagation, logTimestamp]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setExpanded(false);
  }, []);

  useLayoutEffect(() => {
    if (!expanded) {
      return;
    }

    const outerEl = outerRef.current;
    if (!outerEl || !traceIconRef.current) {
      return;
    }

    const updateOffset = () => {
      if (traceIconRef.current && outerEl) {
        const iconRect = traceIconRef.current.getBoundingClientRect();
        const outerRect = outerEl.getBoundingClientRect();
        setArrowOffset(iconRect.left - outerRect.left + iconRect.width / 2);
      }
    };

    updateOffset();

    const observer = new ResizeObserver(updateOffset);
    observer.observe(outerEl);
    return () => observer.disconnect();
  }, [expanded]);

  const gridClassName = cx(hasTraceColumn ? styles.timelineItemWithTrace : styles.timelineItem, {
    [styles.timelineItemExpanded]: expanded,
  });

  return (
    <div data-testid={`event-log-${log.id}`} ref={outerRef}>
      <div className={gridClassName}>
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
        {hasTraceColumn && (
          <div className={styles.traceIconCell} ref={traceIconRef}>
            {traceId && (
              <TraceIconButton
                isLoading={isLoading}
                isError={isError}
                traceExists={traceExists}
                isAwaitingPropagation={isAwaitingPropagation}
                expanded={expanded}
                onToggle={handleToggle}
                onRetry={refetch}
                logoUrl={tracesDS?.meta?.info?.logos?.small}
              />
            )}
          </div>
        )}
        <LabelRenderer log={log} mainKey={mainKey} />
      </div>
      {expanded && tracesDS && traceData && traceExists && (
        <TracePanel
          traceId={traceId!}
          tracesDS={tracesDS}
          traceData={traceData}
          logTimestamp={logTimestamp}
          arrowOffset={arrowOffset}
          onClose={handleClose}
        />
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
}: {
  log: ParsedLokiRecord<Record<string, string>, Record<string, string>>;
  mainKey: string;
}) => {
  const Component = MSG_MAP[log.labels[mainKey]];

  if (Component) {
    return <Component log={log as unknown as HTTPResponseTimingsLog} />;
  }

  return <UniqueLogLabels log={log} />;
};

const BASE_GRID = `
  display: grid;
  align-items: center;
`;

const getStyles = (theme: GrafanaTheme2) => ({
  timelineItem: css`
    ${BASE_GRID}
    grid-template-columns: 210px 65px 3fr minmax(300px, 2fr);
    gap: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.medium};
    padding: ${theme.spacing(0.5)};
  `,
  timelineItemWithTrace: css`
    ${BASE_GRID}
    grid-template-columns: 210px 65px 3fr auto minmax(300px, 2fr);
    gap: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.medium};
    padding: ${theme.spacing(0.5)};
  `,
  timelineItemExpanded: css`
    border-bottom-color: transparent;
  `,
  mainKey: css`
    overflow-x: auto;
  `,
  traceIconCell: css`
    min-width: ${theme.spacing(4)};
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
