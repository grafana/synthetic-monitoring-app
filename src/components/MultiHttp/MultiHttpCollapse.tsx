import React, { useEffect, useState, PropsWithChildren } from 'react';
import { Icon, useTheme } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';

interface Props {
  isOpen?: boolean;
  label: string | JSX.Element;
  loading?: boolean;
  collapsible?: boolean;
  onToggle?: (index: number) => void;
  className?: string | string[];
  index: number;
  item?: { [key: number]: boolean };
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

export const MultiHttpCollapse = ({
  isOpen,
  label,
  children,
  onToggle,
  className,
  index,
  item,
  ...props
}: PropsWithChildren<Props>) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [isIndexOpen, setIsIndexOpen] = useState<boolean>();

  useEffect(() => {
    item && setIsIndexOpen(Object.values(item).pop() as boolean);
  }, [item]);

  return (
    <div className={cx([!className ? 'panel-container' : className, styles.container])}>
      <div
        className={styles.header}
        onClick={() => {
          return onToggle && index !== undefined ? onToggle(index) : null;
        }}
      >
        <>
          <Icon name={isIndexOpen ? 'angle-down' : 'angle-right'} className={styles.headerIcon} />
          <div className={styles.label}>{label}</div>
        </>
      </div>
      <div className={cx(styles.body, { [styles.hidden]: !isIndexOpen })}>{children}</div>
    </div>
  );
};
