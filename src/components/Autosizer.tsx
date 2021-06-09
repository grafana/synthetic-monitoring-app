import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { useRef, useEffect, useState } from 'react';
import { css } from '@emotion/css';

interface ChildrenArgs {
  width: number;
  height: number;
}

interface Props {
  children: (dimensions: ChildrenArgs) => JSX.Element;
}

const getStyles = (theme: GrafanaTheme2) => ({
  fillContainer: css`
    display: flex;
    justify-content: center;
    max-width: 1300px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  `,
});

export const Autosizer = ({ children }: Props) => {
  const el = useRef<HTMLDivElement>(null);
  const styles = useStyles2(getStyles);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const width = el.current?.scrollWidth;
    const height = el.current?.scrollHeight;
    if (width !== undefined && height !== undefined) {
      setSize({ width, height });
    }
  }, [el]);

  return (
    <div className={styles.fillContainer} ref={el}>
      {children(size)}
    </div>
  );
};
