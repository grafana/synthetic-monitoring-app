import React, { useState } from 'react';
import { useStyles } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';
import { CopyToClipboard } from './CopyToClipboard';

const getStyles = (theme: GrafanaTheme) => ({
  code: css`
    width: 100%;
    word-break: break-all;
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
}

export function Clipboard({ content }: Props) {
  const styles = useStyles(getStyles);
  const [copyClipboard, setCopyclipboard] = useState(false);
  return (
    <div className={styles.container}>
      <pre className={styles.code}>{content}</pre>

      <CopyToClipboard
        className={styles.button}
        variant="primary"
        fill="text"
        icon={!copyClipboard ? 'clipboard-alt' : 'check'}
        onClick={(e) => e.preventDefault()}
        getText={() => {
          setCopyclipboard(true);
          return content;
        }}
      >
        {!copyClipboard ? 'Copy to clipboard' : 'Copied to clipboard'}
      </CopyToClipboard>
    </div>
  );
}
