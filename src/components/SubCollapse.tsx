import { GrafanaTheme } from '@grafana/data';
import { Icon, useStyles } from '@grafana/ui';
import React, { PropsWithChildren, useState } from 'react';
import { css, cx } from '@emotion/css';

interface Props {
  title: string;
}

const getStyles = (theme: GrafanaTheme) => ({
  header: css`
    border-top: 1px solid ${theme.isDark ? '#343b40' : '#c7d0d9'};
    display: flex;
    align-items: center;
    padding: ${theme.spacing.sm} 0;
    cursor: pointer;
  `,
  headerOpen: css`
    padding-bottom: 0;
  `,
  headerIcon: css`
    margin-right: ${theme.spacing.sm};
  `,
  title: css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.weight.semibold};
    color: ${theme.colors.formLabel};
  `,
  hidden: css`
    display: none;
  `,
  visible: css`
    padding-left: ${theme.spacing.lg};
  `,
});

export const SubCollapse = ({ children, title }: PropsWithChildren<Props>) => {
  const [isOpen, setIsOpen] = useState(false);
  const styles = useStyles(getStyles);
  return (
    <div>
      <div className={cx(styles.header, { [styles.headerOpen]: isOpen })} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} className={styles.headerIcon} />
        <span className={styles.title}>{title}</span>
      </div>
      <div className={!isOpen ? styles.hidden : styles.visible}>{children}</div>
    </div>
  );
};
