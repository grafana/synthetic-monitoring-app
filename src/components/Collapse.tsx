import React, { PropsWithChildren } from 'react';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

interface Props {
  isOpen?: boolean;
  label: string | JSX.Element;
  loading?: boolean;
  collapsible?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border-left: none;
    border-right: none;
    border-bottom: none;
    margin-bottom: 0;
    padding: ${theme.spacing(2)} 0;
  `,
  header: css`
    display: flex;
    align-items: center;
    transition: all 0.1s linear;
    cursor: pointer;
  `,
  headerExpanded: css`
    padding-bottom: ${theme.spacing(1)};
  `,
  headerIcon: css`
    margin-right: ${theme.spacing(1)};
  `,
  label: css`
    margin-right: ${theme.spacing(1)};
    font-size: ${theme.typography.h4.fontSize};
  `,
  body: css`
    padding-top: ${theme.spacing(1)};
  `,
  hidden: css`
    display: none;
  `,
});

export const Collapse = ({ isOpen, label, children, onToggle, ...props }: PropsWithChildren<Props>) => {
  const styles = useStyles2(getStyles);

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
