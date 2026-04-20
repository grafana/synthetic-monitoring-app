import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LogEntry } from './types.adhoc-check';
import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { SCREENSHOT_PATTERN } from 'scenes/components/LogsRenderer/screenshots/screenshots.constants';
import { useScreenshots } from 'scenes/components/LogsRenderer/screenshots/screenshots.hooks';
import { ScreenshotThumbnail } from 'scenes/components/LogsRenderer/screenshots/ScreenshotThumbnail';

import { REDUNDANT_FIRST_LINES } from './constants';
import { LogDetails } from './LogDetails';
import { LogMessage } from './LogMessage';
import { getLogLevelFromMessage, isExpectLogLine, isMultiLineString, parseExpectLogLine, stringToLines } from './utils';

export function LogItem({ log, from, to }: { log: LogEntry; from: number | string; to: number | string }) {
  const { msg, ...props } = log;
  const logLevel = getLogLevelFromMessage(log.msg, log.level);
  const [isOpen, setIsOpen] = useState(logLevel === 'error');
  const styles = useStyles2(getStyles);
  const { isEnabled: screenshotsEnabled } = useFeatureFlag(FeatureName.Screenshots);

  const screenshotUUIDs = useMemo(() => {
    if (!screenshotsEnabled || !msg) {
      return [];
    }

    const match = msg.match(SCREENSHOT_PATTERN);
    return match?.[1] ? [match[1]] : [];
  }, [msg, screenshotsEnabled]);

  const screenshotDataByUUID = useScreenshots(screenshotUUIDs, from, to);

  const screenshotData = screenshotUUIDs.length > 0 ? screenshotDataByUUID.get(screenshotUUIDs[0]) : undefined;

  const multiLineMessage = useMemo(() => {
    if (msg && isExpectLogLine(msg)) {
      return parseExpectLogLine(msg);
    }

    if (msg && isMultiLineString(msg)) {
      const [first, ...rest] = stringToLines(msg);

      if (REDUNDANT_FIRST_LINES.includes(first)) {
        return rest.filter(Boolean).join('\n');
      }

      return [first, ...rest].filter(Boolean).join('\n');
    }

    return undefined;
  }, [msg]);

  if (screenshotData) {
    return (
      <div className={styles.container}>
        <ScreenshotThumbnail
          base64={screenshotData.screenshot_base64}
          url={screenshotData.screenshot_url}
          caption={screenshotData.caption}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={cx(styles.msg, styles.backgroundHover)} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <LogMessage log={log} logLevel={logLevel} />
      </div>
      <div className={styles.details}>
        {isOpen && (
          <>
            {multiLineMessage !== undefined && <LogDetails content={multiLineMessage} />}
            <LogDetails content={props} />
          </>
        )}
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    details: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      position: relative;
      padding-left: ${theme.spacing(2)};

      & > *:last-child {
        margin-bottom: ${theme.spacing(2)};
      }
    `,
    msg: css`
      display: flex;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(0.5, 1)};
      cursor: pointer;
      border-radius: ${theme.shape.radius.default};
      color: ${theme.colors.text.secondary};
      align-items: center;
      word-break: break-all;

      & span {
        font-family: ${theme.typography.fontFamilyMonospace};
        font-size: ${theme.typography.bodySmall.fontSize};
      }
    `,
    backgroundHover: css`
      &:hover {
        background-color: ${theme.colors.action.hover};
        transition: ${theme.transitions.create(['background-color'])};
      }
    `,
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(0.5)};
    `,
  };
}
