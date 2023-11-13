import React, { forwardRef, PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface Props {
  label: string;
  invalid?: boolean;
  className?: string | string[];
  isOpen: boolean;
  onToggle: () => void;
}

export const MultiHttpCollapse = forwardRef<HTMLButtonElement, PropsWithChildren<Props>>(function MultiHttpCollapse(
  { label, children, invalid, className, isOpen, onToggle },
  ref
) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx([!className ? 'panel-container' : className])}>
      <button
        className={styles.header}
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        ref={ref}
        type="button"
      >
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} className={styles.headerIcon} />
        <div className={styles.label}>{label}</div>
        {!isOpen && invalid && <Icon name="exclamation-triangle" className={styles.errorIcon} />}
      </button>
      <div className={cx(styles.body, { [styles.hidden]: !isOpen })}>{children}</div>
    </div>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  header: css`
    display: flex;
    align-items: center;
    transition: all 0.1s linear;
    border: none;
    background: none;
    padding: ${theme.spacing(2)};
    width: 100%;
  `,
  headerIcon: css`
    margin-right: ${theme.spacing(1)};
  `,
  label: css`
    margin-right: ${theme.spacing(1)};
    font-size: ${theme.typography.h4.fontSize};
  `,
  body: css`
    padding: ${theme.spacing(2)};
  `,
  hidden: css`
    display: none;
  `,
  errorIcon: css`
    color: ${theme.colors.error.text};
    margin-left: ${theme.spacing(1)};
  `,
});
