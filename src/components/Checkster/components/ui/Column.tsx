import React, { CSSProperties, PropsWithChildren } from 'react';
import IntrinsicElements = React.JSX.IntrinsicElements;
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface ColumnProps extends PropsWithChildren<IntrinsicElements['div']> {
  fill?: boolean;
  gap?: number;
  grow?: boolean;
  shrink?: boolean;
  basis?: number | string;
  overflow?: CSSProperties['overflow'];
  padding?: number | CSSProperties['padding'];
}

export function Column({
  children,
  className,
  fill,
  gap,
  grow,
  basis,
  shrink,
  overflow,
  padding,
  ...rest
}: ColumnProps) {
  const styles = useStyles2(getStyles, gap, basis, overflow, padding);

  return (
    <div
      className={cx(
        styles.root,
        {
          [styles.fill]: fill,
          [styles.gap]: gap !== undefined,
          [styles.shrink]: shrink,
          [styles.grow]: grow,
          [styles.basis]: basis !== undefined,
          [styles.overflow]: overflow !== undefined,
          [styles.padding]: padding !== undefined,
        },
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function getStyles(
  theme: GrafanaTheme2,
  gap = 0,
  basis: string | number = 'auto',
  overflow: CSSProperties['overflow'] = 'initial',
  padding: number | CSSProperties['padding'] = 'initial'
) {
  return {
    root: css`
      display: flex;
      flex-direction: column;
      flex: 0 0 auto;
    `,
    fill: css`
      flex: 1 1 0;
    `,
    gap: css`
      gap: ${theme.spacing(gap)};
    `,
    shrink: css`
      flex-shrink: 1;
    `,
    grow: css`
      flex-grow: 1;
    `,
    basis: css`
      flex-basis: ${basis};
    `,
    overflow: css`
      overflow: ${overflow};
    `,
    padding: css`
      padding: ${typeof padding === 'number' ? theme.spacing(padding) : padding};
    `,
  };
}
