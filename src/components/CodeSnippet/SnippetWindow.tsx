import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface SnippetWindowProps {
  titleContent?: ReactNode;
  children?: ReactNode;
  className?: string;
  hideHeader?: boolean;
}

interface TitleBarProps {
  children?: ReactNode;
}

function TitleBar({ children }: TitleBarProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.titleBarContainer}>
      <div className={styles.windowControls}>
        <span className={styles.windowControlItem} />
        <span className={styles.windowControlItem} />
        <span className={styles.windowControlItem} />
      </div>
      {children}
    </div>
  );
}

export function SnippetWindow({ titleContent, className, children, hideHeader }: SnippetWindowProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.appWindowStyled, className)}>
      {!hideHeader && <TitleBar>{titleContent}</TitleBar>}
      <div className={styles.contentContainer}>{children}</div>
    </div>
  );
}

export function getStyles(theme: GrafanaTheme2) {
  return {
    appWindowStyled: css({
      width: '100%',
      marginBottom: '20px',
      borderRadius: theme.shape.radius.default, // same as code/pre
      overflow: 'hidden',
    }),
    titleBarContainer: css({
      backgroundColor: theme.colors.border.medium,
      minHeight: '42px', // Height of TabBar
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 2),
    }),
    windowControls: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      height: '100%',
      marginRight: '10px',
    }),
    windowControlItem: css({
      width: '10px',
      height: '10px',
      background: theme.colors.border.weak,
      borderRadius: '50%',
      display: 'inline-block',
      marginRight: '5px',
    }),
    contentContainer: css({
      display: 'flex',
      flexDirection: 'column',
      border: `1px ${theme.colors.border.medium} solid`,
      borderTopWidth: '0',
      textAlign: 'left',
    }),
  };
}
