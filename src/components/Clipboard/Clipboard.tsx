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
}

export function Clipboard({ content, className, truncate, highlight, isCode }: ClipboardProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.container, className)}>
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
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  button: css`
    margin-left: auto;
  `,
});
