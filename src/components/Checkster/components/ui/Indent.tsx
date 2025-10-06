import React, { PropsWithChildren } from 'react';
import { useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function Indent({ children }: PropsWithChildren) {
  const theme = useTheme2();
  return (
    <div
      className={css`
        margin-left: ${theme.spacing(5)};
      `}
    >
      {children}
    </div>
  );
}
