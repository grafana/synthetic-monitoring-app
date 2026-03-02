import React, { useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Modal, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LogEntry } from './types.adhoc-check';

import { REDUNDANT_FIRST_LINES } from './constants';
import { LogDetails } from './LogDetails';
import { LogMessage } from './LogMessage';
import { getLogLevelFromMessage, isExpectLogLine, isMultiLineString, parseExpectLogLine, stringToLines } from './utils';
import { useSMDS } from 'hooks/useSMDS';

// Pattern to match screenshot logs with UUID format
const SCREENSHOT_PATTERN = /screenshot:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function LogItem({ log }: { log: LogEntry }) {
  const { msg, ...props } = log;
  const logLevel = getLogLevelFromMessage(log.msg, log.level);
  const [isOpen, setIsOpen] = useState(logLevel === 'error');
  const styles = useStyles2(getStyles);
  const dataSource = useSMDS();
  const [screenshotData, setScreenshotData] = useState<Record<string, any> | null>(null);
  const [modalScreenshot, setModalScreenshot] = useState<{ base64: string; caption?: string } | null>(null);

  // Check if this log contains a screenshot UUID
  const screenshotUUID = useMemo(() => {
    if (msg) {
      const match = msg.match(SCREENSHOT_PATTERN);
      return match ? match[1] : null;
    }
    return null;
  }, [msg]);

  // Fetch screenshot data if UUID is present
  useEffect(() => {
    if (!screenshotUUID) {
      return;
    }

    const fetchScreenshot = async () => {
      try {
        const expr = `{source="synthetic-monitoring-agent-screenshot"} |~ "${screenshotUUID}" | json`;
        const result = await dataSource.queryLogsV2(expr, 'now-1h', 'now');

        if (result?.results?.A?.frames?.[0]) {
          const frame = result.results.A.frames[0];
          const values = frame.data?.values;

          if (values && values.length > 0) {
            const lineIndex = frame.schema?.fields?.findIndex((f: any) => f.name === 'line' || f.name === 'Line');

            if (lineIndex !== undefined && lineIndex >= 0 && values[lineIndex] && values[lineIndex][0]) {
              const line = values[lineIndex][0];
              if (typeof line === 'string') {
                const parsed = JSON.parse(line);
                setScreenshotData(parsed);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch screenshot for adhoc check:', error);
      }
    };

    fetchScreenshot();
  }, [screenshotUUID, dataSource]);

  const multiLineMessage = useMemo(() => {
    if (msg && isExpectLogLine(msg)) {
      return parseExpectLogLine(msg);
    }

    if (msg && isMultiLineString(msg)) {
      // Remove empty lines
      const [first, ...rest] = stringToLines(msg);

      // Remove known redundant first lines
      if (REDUNDANT_FIRST_LINES.includes(first)) {
        return rest.filter(Boolean).join('\n');
      }
      // Remove empty lines
      return [first, ...rest].filter(Boolean).join('\n');
    }

    return undefined;
  }, [msg]);

  const screenshotBase64 = screenshotData?.screenshot_base64;
  const caption = screenshotData?.caption;

  return (
    <div className={styles.container}>
      <div className={cx(styles.msg, styles.backgroundHover)} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <LogMessage log={log} logLevel={logLevel} />
      </div>
      {screenshotBase64 && (
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
      )}
      <div className={styles.details}>
        {isOpen && (
          <>
            {multiLineMessage !== undefined && <LogDetails content={multiLineMessage} />}
            <LogDetails content={props} />
          </>
        )}
      </div>
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
    screenshotContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      padding-left: ${theme.spacing(3)};
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
}
