import React, { PropsWithChildren } from 'react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function LayoutSectionContent({ children }: PropsWithChildren) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container} tabIndex={0}>
      {children}
    </div>
  );
}

function getStyles() {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      flex-basis: 0;
      flex-grow: 1;
      overflow: auto;
    `,
  };
}
