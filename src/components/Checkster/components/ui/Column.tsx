import React, { CSSProperties, PropsWithChildren } from 'react';
import IntrinsicElements = React.JSX.IntrinsicElements;
import { useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface ColumnProps extends PropsWithChildren<IntrinsicElements['div']> {
  fill?: boolean;
  gap?: number;
  grow?: boolean;
  shrink?: boolean;
  basis?: number | string;
  overflow?: CSSProperties['overflow'];
  padding?: number | CSSProperties['overflow'];
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
  const theme = useTheme2();
  return (
    <div
      className={cx(
        css`
          display: flex;
          flex-direction: column;
          flex: 0 0 auto;
        `,
        fill &&
          css`
            flex: 1 1 0;
          `,
        gap !== undefined &&
          css`
            gap: ${theme.spacing(gap)};
          `,
        shrink !== undefined &&
          css`
            flex-shrink: 1;
          `,
        grow !== undefined &&
          css`
            flex-grow: 1;
          `,
        basis !== undefined &&
          css`
            flex-basis: ${basis};
          `,
        overflow !== undefined &&
          css`
            overflow: ${overflow};
          `,
        padding !== undefined &&
          css`
            padding: ${typeof padding === 'number' ? theme.spacing(padding) : padding};
          `,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
