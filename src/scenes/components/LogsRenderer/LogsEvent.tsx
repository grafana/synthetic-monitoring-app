import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Switch, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { LokiFieldNames, UnknownParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { LogLine } from 'scenes/components/LogsRenderer/LogLine';
import { TRACE_ID_LABEL_NAMES } from 'scenes/components/LogsRenderer/TraceLink.constants';

import { SCREENSHOT_PATTERN } from './screenshots/screenshots.constants';
import { useScreenshots } from './screenshots/screenshots.hooks';
import { extractScreenshotUUIDs } from './screenshots/screenshots.utils';

export const LogsEvent = <T extends UnknownParsedLokiRecord>({ logs, mainKey }: { logs: T[]; mainKey: string }) => {
  const styles = useStyles2(getStyles);
  const { isEnabled: screenshotsEnabled } = useFeatureFlag(FeatureName.Screenshots);

  const [showHttpDebug, setShowHttpDebug] = useState(false);
  const [hideScreenshots, setHideScreenshots] = useState(false);

  const screenshotUUIDs = useMemo(
    () => (screenshotsEnabled ? extractScreenshotUUIDs(logs, mainKey) : []),
    [logs, mainKey, screenshotsEnabled]
  );

  const screenshotDataByUUID = useScreenshots(screenshotUUIDs);

  const enrichedLogs = useMemo(() => {
    if (!screenshotsEnabled || screenshotDataByUUID.size === 0) {
      return logs;
    }

    return logs.map((log) => {
      const message = log.labels[mainKey];
      const match = message?.match(SCREENSHOT_PATTERN);

      if (!match?.[1]) {
        return log;
      }

      const screenshotData = screenshotDataByUUID.get(match[1]);

      if (!screenshotData) {
        return log;
      }

      return {
        ...log,
        labels: { ...log.labels, ...screenshotData },
      } as T;
    });
  }, [logs, mainKey, screenshotDataByUUID, screenshotsEnabled]);

  const filteredLogs = useMemo(() => {
    let filtered = enrichedLogs;

    if (!showHttpDebug) {
      filtered = filtered.filter((log) => {
        const body = log[LokiFieldNames.Body];
        return typeof body !== 'string' || !/source[=:]"?http-debug"?/.test(body);
      });
    }

    if (screenshotsEnabled && hideScreenshots) {
      filtered = filtered.filter((log) => {
        const message = log.labels[mainKey];
        return !message || !SCREENSHOT_PATTERN.test(message);
      });
    }

    return filtered;
  }, [enrichedLogs, showHttpDebug, hideScreenshots, mainKey, screenshotsEnabled]);

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
      <div className={styles.filterBar}>
        {screenshotsEnabled && (
          <>
            <Badge text="NEW" color="orange" />
            <label className={styles.filterLabel}>
              <Switch checked={hideScreenshots} onChange={(e) => setHideScreenshots(e.currentTarget.checked)} />
              <span>hide screenshots</span>
            </label>
          </>
        )}
        <label className={styles.filterLabel}>
          <Switch checked={showHttpDebug} onChange={(e) => setShowHttpDebug(e.currentTarget.checked)} />
          <span>show http-debug logs</span>
        </label>
      </div>
      {filteredLogs.map((log) => (
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
  filterBar: css`
    padding: ${theme.spacing(1, 2)};
    border-bottom: 1px solid ${theme.colors.border.medium};
    background-color: ${theme.colors.background.secondary};
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${theme.spacing(2)};
  `,
  filterLabel: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    cursor: pointer;
    margin: 0;
  `,
});
