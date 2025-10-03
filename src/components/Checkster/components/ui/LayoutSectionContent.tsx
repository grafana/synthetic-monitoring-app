import React, { PropsWithChildren } from 'react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function LayoutSectionContent({ children }: PropsWithChildren) {
  const className = useStyles2(getClassName);
  return <div className={className}>{children}</div>;
}

function getClassName() {
  return css`
    display: flex;
    flex-direction: column;
    flex-basis: 0;
    flex-grow: 1;
    overflow: auto;
  `;
}
