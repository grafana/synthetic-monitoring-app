import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import React, { ReactChildren } from 'react';
import { bell, checkSquare, brackets } from 'img';

const getCardStyles = (theme: GrafanaTheme2) => ({
  container: css`
    background-color: ${theme.colors.background.primary};
    border: 1px solid ${theme.isDark ? theme.colors.border.medium : theme.colors.border.weak};
    padding: ${theme.spacing(4)};
    box-shadow: ${theme.isDark ? '0px 4px 10px 0px rgba(0, 0, 0, 0.6)' : '0px 4px 10px 0px rgba(195, 195, 195, 0.2)'};
  `,
});

const icons = {
  'check-square': checkSquare,
  bell: bell,
  brackets: brackets,
};

interface Props {
  children: ReactChildren;
  className?: string;
}

export const DisplayCard = ({ children, className, ...rest }: Props | React.HTMLAttributes<HTMLDivElement>) => {
  const styles = useStyles2(getCardStyles);
  return (
    <div className={cx(styles.container, className)} {...rest}>
      {children}
    </div>
  );
};

const getHeaderStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
    margin-bottom: ${theme.spacing(2)};
  `,
  icon: css`
    width: 20px;
    height: 20px;
    margin-right: ${theme.spacing(1)};
  `,
  heading: css`
    margin-bottom: 0;
  `,
});

type HeaderIcons = 'check-square' | 'brackets' | 'bell';

interface HeaderProps {
  text: string;
  icon: HeaderIcons;
  className?: string;
}

const DisplayCardHeader = ({ text, icon, className }: HeaderProps) => {
  const styles = useStyles2(getHeaderStyles);
  return (
    <div className={cx(styles.container, className)}>
      <img src={icons[icon]} className={styles.icon} />
      <h3 className={styles.heading}>{text}</h3>
    </div>
  );
};

DisplayCard.Header = DisplayCardHeader;
