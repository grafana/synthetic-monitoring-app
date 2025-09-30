import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function SecondaryContainer({ children }: PropsWithChildren) {
  const className = useStyles2(getClassName);
  return <div className={className}>{children}</div>;
}

function getClassName(theme: GrafanaTheme2) {
  return css`
    padding: ${theme.spacing(1)};
    background-color: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    // border: 1px solid ${theme.colors.border.medium};
  `;
}
