import React, { PropsWithChildren } from 'react';
import { Icon, useTheme } from '@grafana/ui';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';

interface Props {
  isOpen?: boolean;
  label: string;
  loading?: boolean;
  collapsible?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    border-left: none;
    border-right: none;
    border-bottom: none;
    margin-bottom: 0;
    padding: ${theme.spacing.md} 0;
  `,
  header: css`
    display: flex;
    align-items: center;
    transition: all 0.1s linear;
    cursor: pointer;
  `,
  headerExpanded: css`
    padding-bottom: ${theme.spacing.sm};
  `,
  headerIcon: css`
    margin-right: ${theme.spacing.sm};
  `,
  label: css`
    margin-right: ${theme.spacing.sm};
    font-size: ${theme.typography.heading.h4};
  `,
  body: css`
    padding-top: ${theme.spacing.sm};
  `,
  hidden: css`
    display: none;
  `,
});

export const Collapse = ({ isOpen, label, children, onToggle, ...props }: PropsWithChildren<Props>) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <div className={cx(['panel-container', styles.container])}>
      <div className={styles.header} onClick={() => onToggle && onToggle(Boolean(isOpen))}>
        <div className={styles.label}>{label}</div>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} className={styles.headerIcon} />
      </div>
      <div className={cx(styles.body, { [styles.hidden]: !isOpen })}>{children}</div>
    </div>
  );
};
