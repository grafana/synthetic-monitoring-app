import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface BigValueTitleProps {
  title?: string;
  infoText?: string;
}

export function BigValueTitle({ title, infoText }: BigValueTitleProps) {
  const styles = useStyles2(getStyles);
  if (infoText) {
    return (
      <Tooltip content={infoText} placement="top">
        <div className={styles.container}>
          <span aria-label={`${title} - ${infoText}`}>{title}</span>
          <Icon name="info-circle" />
        </div>
      </Tooltip>
    );
  }

  if (title) {
    return <div className={styles.container}>{title}</div>;
  }

  return '';
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      display: inline-flex;
      gap: ${theme.spacing(1)};
      align-items: center;
      font-size: ${theme.typography.bodySmall.fontSize};
      line-height: ${theme.typography.bodySmall.lineHeight};
    `,
  };
}
