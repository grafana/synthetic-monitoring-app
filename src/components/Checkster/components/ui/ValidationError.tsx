import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface ValidationErrorProps extends PropsWithChildren {
  className?: string;
  severity?: 'error' | 'warning';
}

export function ValidationError({ className, children, severity = 'error' }: ValidationErrorProps) {
  const styles = useStyles2(getStyles);
  return (
    <div
      className={cx(
        styles.root,
        {
          [styles.severityError]: severity !== 'warning', // defensive coding
          [styles.severityWarning]: severity === 'warning',
        },
        className
      )}
      role="alert"
    >
      <Stack gap={1} direction="row" alignItems="center">
        <Icon name="exclamation-triangle" />
        <div>{children}</div>
      </Stack>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    root: css`
      display: inline-block;
      position: relative;
      padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
      font-size: ${theme.typography.bodySmall
        .fontSize}; // Can't use Text since it will nullify the font-weight and requires additional code to handle null as child
      line-height: ${theme.typography.bodySmall.lineHeight};
      font-weight: ${theme.typography.fontWeightBold};
      border-radius: ${theme.shape.radius.default};

      &:before {
        content: '';
        position: absolute;
        left: 9px;
        top: -5px;
        width: 0;
        height: 0;
        border-width: 0 4px 5px;
        border-style: solid;
      }
    `,
    severityError: css`
      background-color: ${theme.colors.error.main};
      color: ${theme.colors.error.contrastText};
      &:before {
        border-color: transparent transparent ${theme.colors.error.main};
      }
    `,
    severityWarning: css`
      background-color: ${theme.colors.warning.main};
      color: ${theme.colors.warning.contrastText};
      &:before {
        border-color: transparent transparent ${theme.colors.warning.main};
      }
    `,
  };
}
