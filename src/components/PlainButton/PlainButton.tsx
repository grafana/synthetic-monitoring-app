import React, { forwardRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { styleMixins, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface PlainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showFocusStyles?: boolean;
}

export const PlainButton = forwardRef<HTMLButtonElement, PlainButtonProps>(function PlainButton(
  { children, showFocusStyles = true, ...props },
  ref
) {
  const styles = getStyles(useTheme2(), showFocusStyles);
  return (
    <button {...props} className={cx(styles.button, props.className)} ref={ref}>
      {children}
    </button>
  );
});

const getStyles = (theme: GrafanaTheme2, showFocusStyles: boolean) => {
  const overrideFocusStyles = css`
    outline: none;
    outline-offset: 0;
    box-shadow: none;
  `;

  return {
    button: css`
      background-color: transparent;
      border: none;
      padding: 0;
      margin: 0;
      cursor: pointer;

      &:focus-visible {
        ${showFocusStyles ? styleMixins.getFocusStyles(theme) : overrideFocusStyles};
      }
    `,
  };
};
