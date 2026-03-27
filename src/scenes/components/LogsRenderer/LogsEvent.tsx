import React, { useMemo, useState } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Badge, Switch, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { HTTPResponseTimingsLog } from 'features/parseCheckLogs/checkLogs.types.http';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { LogHTTPResponseTimings } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings';
import { UniqueLogLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels';

import { SCREENSHOT_PATTERN } from './screenshots/screenshots.constants';
import { useScreenshots } from './screenshots/screenshots.hooks';
import { extractScreenshotUUIDs } from './screenshots/screenshots.utils';
import { ScreenshotThumbnail } from './screenshots/ScreenshotThumbnail';

export const LogsEvent = <T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>({
  logs,
  mainKey,
}: {
  logs: T[];
  mainKey: string;
}) => {
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
      {filteredLogs.map((log, index) => {
        const level = log.labels.detected_level;
        const message = log.labels[mainKey];
        const screenshotBase64 = screenshotsEnabled ? log.labels.screenshot_base64 : undefined;
        const screenshotUrl = screenshotsEnabled ? log.labels.screenshot_url : undefined;
        const caption = screenshotsEnabled ? log.labels.caption : undefined;

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
              {screenshotBase64 || screenshotUrl ? (
                <ScreenshotThumbnail base64={screenshotBase64} url={screenshotUrl} caption={caption} />
              ) : (
                message
              )}
            </div>
            <LabelRenderer log={filteredLogs[index]} mainKey={mainKey} />
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
  };
};
