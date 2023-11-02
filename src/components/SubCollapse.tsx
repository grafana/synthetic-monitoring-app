import React, { PropsWithChildren, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface Props {
  title: string;
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css`
    border-top: 1px solid ${theme.isDark ? '#343b40' : '#c7d0d9'};
    display: flex;
    align-items: center;
    padding: ${theme.spacing(2)} 0;
    cursor: pointer;
  `,
  headerOpen: css`
    padding-bottom: 0;
  `,
  headerIcon: css`
    margin-right: ${theme.spacing(1)};
  `,
  title: css`
    font-size: ${theme.typography.h6.fontSize};
    font-weight: ${theme.typography.fontWeightBold};
    color: ${theme.colors.text.secondary};
  `,
  hidden: css`
    display: none;
  `,
  visible: css`
    padding-left: ${theme.spacing(3)};
  `,
});

export const SubCollapse = ({ children, title }: PropsWithChildren<Props>) => {
  const [isOpen, setIsOpen] = useState(false);
  const styles = useStyles2(getStyles);
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
