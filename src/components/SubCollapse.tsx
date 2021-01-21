import { GrafanaTheme } from '@grafana/data';
import { Icon, useStyles } from '@grafana/ui';
import React, { FC, useState } from 'react';
import { css, cx } from 'emotion';

interface Props {
  title: string;
}

const getStyles = (theme: GrafanaTheme) => ({
  header: css`
    border-top: 1px solid #343b40;
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
    font-weight: ${theme.typography.weight.bold};
  `,
  hidden: css`
    display: none;
  `,
  visible: css`
    padding-left: ${theme.spacing.lg};
  `,
});

export const SubCollapse: FC<Props> = ({ children, title }) => {
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
