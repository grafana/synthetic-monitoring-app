import React from 'react';
import { AppEvents, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import appEvents from 'grafana/app/core/app_events';
import { css, cx } from '@emotion/css';

import { Preformatted } from '../Preformatted';
import { CopyToClipboard } from './CopyToClipboard';

interface ClipboardProps {
  content: string;
  className?: string;
  truncate?: boolean;
  highlight?: string | string[];
  isCode?: boolean;
  inlineCopy?: boolean;
}

export function Clipboard({ content, className, truncate, highlight, isCode, inlineCopy = false }: ClipboardProps) {
  const styles = useStyles2(getStyles);

  return (
    <div
      className={cx(className, {
        [styles.inlineCopy]: inlineCopy,
        [styles.outsideCopy]: !inlineCopy,
      })}
    >
      <Preformatted isCode={isCode} highlight={highlight} data-testid="clipboard-content">
        {truncate ? content.slice(0, 150) + '...' : content}
      </Preformatted>

      <CopyToClipboard
        className={styles.button}
        variant="primary"
        fill="text"
        buttonText="Copy to clipboard"
        buttonTextCopied="Copied to clipboard"
        content={content}
        onClipboardError={(err) => {
          appEvents.emit(AppEvents.alertError, [`Failed to copy to clipboard: ${err}`]);
        }}
        iconButton={inlineCopy}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  outsideCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  inlineCopy: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  button: css`
    margin-left: auto;
  `,
});
