import React, { useEffect, useMemo, useState } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Modal, useStyles2 } from '@grafana/ui';
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

export const LogsEvent = <T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>({
  logs,
  mainKey,
}: {
  logs: T[];
  mainKey: string;
}) => {
  const styles = useStyles2(getStyles);
  const dataSource = useSMDS();
  const [screenshotDataByUUID, setScreenshotDataByUUID] = useState<Map<string, Record<string, any>>>(new Map());
  const [fetchedUUIDs, setFetchedUUIDs] = useState<Set<string>>(new Set());
  const [modalScreenshot, setModalScreenshot] = useState<{ base64: string; caption?: string } | null>(null);

  // Extract screenshot UUIDs from logs
  const screenshotUUIDs = useMemo(() => extractScreenshotUUIDs(logs, mainKey), [logs, mainKey]);

  // Fetch screenshot data for each UUID
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

        // Parse results into a map of UUID -> screenshot data
        const dataMap = new Map<string, Record<string, any>>();
        if (result?.results?.A?.frames?.[0]) {
          const frame = result.results.A.frames[0];
          const values = frame.data?.values;

          if (values && values.length > 0) {
            const lineIndex = frame.schema?.fields?.findIndex((f: any) => f.name === 'line' || f.name === 'Line');
            const labelsIndex = frame.schema?.fields?.findIndex((f: any) => f.name === 'labels' || f.name === 'Labels');

            if (lineIndex !== undefined && lineIndex >= 0 && values[lineIndex]) {
              values[lineIndex].forEach((line: unknown, index: number) => {
                if (typeof line === 'string') {
                  try {
                    const parsed = JSON.parse(line);

                    // Try to get UUID from Loki labels
                    let uuid = null;
                    if (labelsIndex !== undefined && labelsIndex >= 0 && values[labelsIndex]) {
                      const labels = values[labelsIndex][index] as Record<string, any>;
                      if (labels && typeof labels === 'object') {
                        uuid = labels.id;
                      }
                    }

                    if (uuid) {
                      dataMap.set(uuid, parsed);
                    }
                  } catch (e) {
                    console.error('Failed to parse screenshot log line:', e);
                  }
                }
              });
            }
          }
        }

        // Update state
        setScreenshotDataByUUID((prev) => new Map([...prev, ...dataMap]));
        setFetchedUUIDs((prev) => new Set([...prev, ...newUUIDs]));
      } catch (error) {
        console.error('Failed to fetch screenshot logs:', error);
      }
    };

    fetchScreenshotLogs();
  }, [screenshotUUIDs, fetchedUUIDs, dataSource]);

  // Enrich logs with screenshot data
  const allLogs = useMemo(() => {
    return logs.map((log) => {
      const message = log.labels[mainKey];
      if (message) {
        const match = message.match(SCREENSHOT_PATTERN);
        if (match && match[1]) {
          const uuid = match[1];
          const screenshotData = screenshotDataByUUID.get(uuid);
          if (screenshotData) {
            // Merge screenshot data into this log entry
            return {
              ...log,
              labels: {
                ...log.labels,
                ...screenshotData,
              },
            } as T;
          }
        }
      }
      return log;
    });
  }, [logs, mainKey, screenshotDataByUUID]);

  return (
    <div className={styles.timelineContainer}>
      {allLogs.map((log, index) => {
        const level = log.labels.detected_level;
        const message = log.labels[mainKey];
        const screenshotBase64 = log.labels.screenshot_base64;
        const caption = log.labels.caption;

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
            <div className={styles.mainKey}>
              {screenshotBase64 ? (
                <div className={styles.screenshotContainer}>
                  {caption && <div className={styles.screenshotCaption}>Screenshot: {caption}</div>}
                  <img
                    src={`data:image/png;base64,${screenshotBase64}`}
                    alt={caption || 'Screenshot'}
                    className={styles.screenshotImage}
                    onClick={() => setModalScreenshot({ base64: screenshotBase64, caption })}
                    title="Click to view full size"
                  />
                </div>
              ) : (
                message
              )}
            </div>
            <LabelRenderer log={allLogs[index]} mainKey={mainKey} />
          </div>
        );
      })}
      {modalScreenshot && (
        <Modal
          title={modalScreenshot.caption ? `Screenshot: ${modalScreenshot.caption}` : 'Screenshot'}
          isOpen={true}
          onDismiss={() => setModalScreenshot(null)}
          contentClassName={styles.screenshotModalContent}
          className={styles.screenshotModalOverride}
        >
          <div className={styles.screenshotModalImageContainer}>
            <img
              src={`data:image/png;base64,${modalScreenshot.base64}`}
              alt={modalScreenshot.caption || 'Screenshot'}
              className={styles.screenshotModalImage}
            />
          </div>
        </Modal>
      )}
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
    screenshotContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
    `,
    screenshotCaption: css`
      font-size: ${theme.typography.body.fontSize};
      color: ${theme.colors.text.primary};
      font-weight: ${theme.typography.fontWeightMedium};
    `,
    screenshotImage: css`
      max-height: 200px;
      width: auto !important;
      height: auto;
      object-fit: contain;
      display: block;
      cursor: pointer;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.8;
      }
    `,
    screenshotModalOverride: css`
      /* Force override Grafana's 750px width */
      && {
        width: 80vw !important;
        max-width: 80vw !important;
      }

      /* Target nested modal elements */
      & > div,
      & [role='dialog'] {
        width: 80vw !important;
        max-width: 80vw !important;
      }
    `,
    screenshotModalContent: css`
      width: 100% !important;
      max-width: 100% !important;
      overflow: hidden;
    `,
    screenshotModalImageContainer: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${theme.spacing(2)};
      overflow: hidden;
    `,
    screenshotModalImage: css`
      max-width: calc(80vw - ${theme.spacing(4)});
      max-height: 75vh;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    `,
  };
};
