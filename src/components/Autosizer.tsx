import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { useRef } from 'react';
import { css } from '@emotion/css';

interface ChildrenArgs {
  width: number;
  height: number;
}

interface Props {
  children: (dimensions: ChildrenArgs) => JSX.Element;
}

const getStyles = (theme: GrafanaTheme2) => ({
  fill: css`
    flex-grow: 1;
    max-width: 100%;
    display: flex;
    justify-content: center;
  `,
  fillContainer: css`
    display: flex;
    max-width: 1300px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  `,
});

export const Autosizer = ({ children }: Props) => {
  const el = useRef<HTMLDivElement>(null);
  const styles = useStyles2(getStyles);

  const rect = el.current?.getBoundingClientRect();

  return (
    <div className={styles.fillContainer}>
      <div className={styles.fill} ref={el}>
        {rect ? children({ width: rect.width, height: rect.height }) : null}
      </div>
    </div>
  );
};
