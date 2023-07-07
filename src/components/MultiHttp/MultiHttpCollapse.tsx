import React, { useState, PropsWithChildren } from 'react';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

interface Props {
  label: string;
  invalid?: boolean;
  className?: string | string[];
}

export const MultiHttpCollapse = ({ label, children, invalid, className }: PropsWithChildren<Props>) => {
  const styles = useStyles2(getStyles);
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
          {!isOpen && invalid && <Icon name="exclamation-triangle" className={styles.errorIcon} />}
        </>
      </div>
      <div className={cx(styles.body, { [styles.hidden]: !isOpen })}>{children}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border-left: none;
    border-right: none;
    border-bottom: none;
    margin-bottom: 10px;
    padding: ${theme.spacing(2)};
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
  errorIcon: css`
    color: ${theme.colors.error.text};
    margin-left: ${theme.spacing(1)};
  `,
});
