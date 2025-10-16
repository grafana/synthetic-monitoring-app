import React from 'react';
import { Icon, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

export function ErrorIcon({ className }: { className?: string }) {
  const theme = useTheme2();
  return (
    <Icon
      name="exclamation-triangle"
      className={cx(
        css`
          color: ${theme.colors.error.text};
        `,
        className
      )}
    />
  );
}
