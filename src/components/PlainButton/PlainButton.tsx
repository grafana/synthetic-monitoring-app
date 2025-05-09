import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { styleMixins, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

export const PlainButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const styles = getStyles(useTheme2());

  return (
    <button {...props} className={cx(styles.button, props.className)}>
      {children}
    </button>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  button: css`
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;

    &:focus-visible {
      ${styleMixins.getFocusStyles(theme)}
    }
  `,
});
