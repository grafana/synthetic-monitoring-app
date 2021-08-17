import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import React, { ReactChildren } from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    background-color: ${theme.colors.background.primary};
    border: 1px solid ${theme.isDark ? theme.colors.border.medium : theme.colors.border.weak};
    padding: ${theme.spacing(4)};
    box-shadow: ${theme.isDark ? '0px 4px 10px 0px rgba(0, 0, 0, 0.6)' : '0px 4px 10px 0px rgba(195, 195, 195, 0.2)'};
  `,
});

interface Props {
  children: ReactChildren;
  className?: string;
}

export const DisplayCard = ({ children, className, ...rest }: Props | React.HTMLAttributes<HTMLDivElement>) => {
  const styles = useStyles2(getStyles);
  return (
    <div className={cx(styles.container, className)} {...rest}>
      {children}
    </div>
  );
};
