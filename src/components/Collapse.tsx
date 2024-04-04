import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface Props {
  className?: string;
  isOpen?: boolean;
  label: ReactNode;
  onClick?: (open: boolean) => void;
}

export const Collapse = ({ className, isOpen, label, children, onClick, ...props }: PropsWithChildren<Props>) => {
  const [isOpenState, setIsOpenState] = React.useState(isOpen);
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.container, className)} {...props}>
      <button
        aria-expanded={isOpenState}
        className={styles.header}
        onClick={() => {
          setIsOpenState(!isOpenState);
          onClick?.(!isOpenState);
        }}
        type="button"
        data-fs-element={`Collapse header ${label}`}
      >
        <div className={styles.label}>{label}</div>
        <Icon name={isOpenState ? 'angle-down' : 'angle-right'} className={styles.headerIcon} />
      </button>
      <div className={cx(styles.body, { [styles.hidden]: !isOpenState })}>{children}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    borderTop: `1px solid ${theme.components.panel.borderColor}`,
    borderRadius: theme.shape.borderRadius(2),
  }),
  header: css({
    background: `none`,
    border: `none`,
    display: `flex`,
    alignItems: `center`,
    transition: `all 0.1s linear`,
    padding: theme.spacing(2, 0),
    zIndex: 1,
    width: `100%`,
  }),
  headerIcon: css({
    marginRight: theme.spacing(1),
  }),
  label: css({
    marginRight: theme.spacing(1),
    fontSize: theme.typography.h4.fontSize,
  }),
  body: css({
    margin: theme.spacing(1, 0, 2),
  }),
  hidden: css({
    display: `none`,
  }),
});
