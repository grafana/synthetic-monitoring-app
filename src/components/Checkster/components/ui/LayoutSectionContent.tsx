import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface LayoutSectionContentProps extends PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> {
  className?: string;
}

export function LayoutSectionContent({ children, className, ...rest }: LayoutSectionContentProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.container, className)} {...rest}>
      {children}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
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
