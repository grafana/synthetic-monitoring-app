import React from 'react';
import { AppEvents } from '@grafana/data';
import { useStyles } from '@grafana/ui';
import appEvents from 'grafana/app/core/app_events';
import { css, cx } from '@emotion/css';

import { CopyToClipboard } from './CopyToClipboard';

const getStyles = () => ({
  code: css`
    width: 100%;
    word-break: break-all;
    overflow-y: scroll;
    max-height: 100%;
  `,
  container: css`
    display: flex;
    flex-direction: column;
  `,
  button: css`
    margin-left: auto;
  `,
});

interface Props {
  content: string;
  className?: string;
  truncate?: boolean;
}

export function Clipboard({ content, className, truncate }: Props) {
  const styles = useStyles(getStyles);

  return (
    <div className={cx(styles.container, className)}>
      <pre className={styles.code} data-testid="clipboard-content">
        {truncate ? content.slice(0, 150) + '...' : content}
      </pre>

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
      />
    </div>
  );
}
