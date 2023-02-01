import React, { useState, PropsWithChildren } from 'react';
import { Icon, useTheme } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';

interface Props {
  label: string | JSX.Element;
  onToggle?: (index: number) => void;
  className?: string | string[];
}

export const MultiHttpCollapse = ({ label, children, className }: PropsWithChildren<Props>) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  return (
    <div className={cx([!className ? 'panel-container' : className, styles.container])}>
      <div
        className={styles.header}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <>
          <Icon name={isOpen ? 'angle-down' : 'angle-right'} className={styles.headerIcon} />
          <div className={styles.label}>{label}</div>
        </>
      </div>
      <div className={cx(styles.body, { [styles.hidden]: !isOpen })}>{children}</div>
    </div>
  );
};

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
