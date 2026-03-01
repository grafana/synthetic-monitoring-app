import React, { useEffect, useMemo, useState } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { HTTPResponseTimingsLog } from 'features/parseCheckLogs/checkLogs.types.http';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { useSMDS } from 'hooks/useSMDS';
import { LogHTTPResponseTimings } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings';
import { UniqueLogLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels';

// Pattern to match screenshot logs with UUID format
const SCREENSHOT_PATTERN = /screenshot:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

// Helper function to extract screenshot UUIDs from logs
function extractScreenshotUUIDs<T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>(
  logs: T[],
  mainKey: string
): string[] {
  const uuids: string[] = [];
  logs.forEach((log) => {
    const message = log.labels[mainKey];
    if (message) {
      const match = message.match(SCREENSHOT_PATTERN);
      if (match && match[1]) {
        uuids.push(match[1]);
      }
    }
  });
  return uuids;
}

// Helper function to parse log line as JSON
function parseLogLine(line: string): ParsedLokiRecord<Record<string, string>, Record<string, string>> | null {
  try {
    const parsed = JSON.parse(line);
    // Create a log record compatible with the existing structure
    return {
      id: `screenshot-${Date.now()}-${Math.random()}`,
      [LokiFieldNames.TimeStamp]: parsed.time || Date.now(),
      [LokiFieldNames.Body]: line,
      labels: {
        ...parsed,
        detected_level: parsed.level || 'info',
      },
    } as ParsedLokiRecord<Record<string, string>, Record<string, string>>;
  } catch (e) {
    console.error('Failed to parse screenshot log line:', e);
    return null;
  }
}

export const LogsEvent = <T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>({
  logs,
  mainKey,
}: {
  logs: T[];
  mainKey: string;
}) => {
  const styles = useStyles2(getStyles);
  const dataSource = useSMDS();
  const [additionalLogs, setAdditionalLogs] = useState<T[]>([]);
  const [fetchedUUIDs, setFetchedUUIDs] = useState<Set<string>>(new Set());

  // Extract screenshot UUIDs from logs
  const screenshotUUIDs = useMemo(() => extractScreenshotUUIDs(logs, mainKey), [logs, mainKey]);

  // Fetch additional logs for each screenshot UUID
  useEffect(() => {
    const fetchScreenshotLogs = async () => {
      const newUUIDs = screenshotUUIDs.filter((uuid) => !fetchedUUIDs.has(uuid));

      if (newUUIDs.length === 0) {
        return;
      }

      try {
        // Build query expression for the UUIDs (similar to adhoc checks)
        const expr = `{source="synthetic-monitoring-agent-screenshot", id=~"(${newUUIDs.join('|')})"} | json`;

        // Query logs
        const result = await dataSource.queryLogsV2(expr, 'now-1h', 'now');

        // Parse results
        const parsedLogs: T[] = [];
        if (result?.results?.A?.frames?.[0]) {
          const frame = result.results.A.frames[0];
          const values = frame.data?.values;

          if (values && values.length > 0) {
            const lineIndex = frame.schema?.fields?.findIndex((f: any) => f.name === 'line' || f.name === 'Line');

            if (lineIndex !== undefined && lineIndex >= 0 && values[lineIndex]) {
              values[lineIndex].forEach((line: unknown) => {
                if (typeof line === 'string') {
                  const parsed = parseLogLine(line);
                  if (parsed) {
                    parsedLogs.push(parsed as T);
                  }
                }
              });
            }
          }
        }

        // Update state
        setAdditionalLogs((prev) => [...prev, ...parsedLogs]);
        setFetchedUUIDs((prev) => new Set([...prev, ...newUUIDs]));
      } catch (error) {
        console.error('Failed to fetch screenshot logs:', error);
      }
    };

    fetchScreenshotLogs();
  }, [screenshotUUIDs, fetchedUUIDs, dataSource]);

  // Combine original logs with additional logs
  const allLogs = useMemo(() => [...logs, ...additionalLogs], [logs, additionalLogs]);

  return (
    <div className={styles.timelineContainer}>
      {allLogs.map((log, index) => {
        const level = log.labels.detected_level;
        const message = log.labels[mainKey];
        const isScreenshotLog = message ? SCREENSHOT_PATTERN.test(message) : false;
        const screenshotBase64 = log.labels.screenshot_base64;

        return (
          <div key={log.id} className={styles.timelineItem} data-testid={`event-log-${log.id}`}>
            <div className={styles.time}>
              {dateTimeFormat(log[LokiFieldNames.TimeStamp], {
                defaultWithMS: true,
              })}
            </div>
            <div
              className={cx(styles.level, {
                [styles.error]: level === 'error',
                [styles.info]: level === 'info',
                [styles.warning]: level === 'warn',
              })}
            >
              {level.toUpperCase()}
            </div>
            <div className={cx(styles.mainKey, { [styles.screenshotHighlight]: isScreenshotLog })}>
              {screenshotBase64 ? (
                <img
                  src={`data:image/png;base64,${screenshotBase64}`}
                  alt="Screenshot"
                  className={styles.screenshotImage}
                />
              ) : (
                message
              )}
            </div>
            <LabelRenderer log={allLogs[index]} mainKey={mainKey} />
          </div>
        );
      })}
    </div>
  );
};

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

const getStyles = (theme: GrafanaTheme2) => {
  return {
    timelineContainer: css`
      position: relative;
      height: 100%;
      width: 100%;
      font-family: ${theme.typography.fontFamilyMonospace};
      overflow-x: auto;
    `,
    timelineItem: css`
      display: grid;
      grid-template-columns: 210px 65px 3fr minmax(300px, 2fr);
      align-items: center;
      gap: ${theme.spacing(2)};
      border-bottom: 1px solid ${theme.colors.border.medium};
      padding: ${theme.spacing(0.5)};
    `,
    mainKey: css`
      /* white-space: pre; // for scripted / browser checks?  */
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
    screenshotHighlight: css`
      background-color: ${theme.colors.error.main};
      color: ${theme.colors.background.primary};
      padding: ${theme.spacing(0.5)};
      border-radius: ${theme.shape.radius.default};
    `,
    screenshotImage: css`
      max-width: 100%;
      max-height: 400px;
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.border.medium};
      display: block;
    `,
  };
};
