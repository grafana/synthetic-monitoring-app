import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface SecondaryContainerProps extends PropsWithChildren {
  withBackgroundColor?: boolean;
}

export function SecondaryContainer({ children, withBackgroundColor }: SecondaryContainerProps) {
  const className = useStyles2(getClassName);
  return <div className={cx(withBackgroundColor && className)}>{children}</div>;
}

function getClassName(theme: GrafanaTheme2) {
  return css`
    padding: ${theme.spacing(1)};
    background-color: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
  `;
}
