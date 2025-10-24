import React, { ComponentProps, ReactElement, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Toggletip as GrafanaToggletip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface ToggletipProps extends Omit<ComponentProps<typeof GrafanaToggletip>, 'content'> {
  content: ReactNode;
  contentClassName?: string;
  children: ReactElement;
}

export const Toggletip = ({ children, content, contentClassName, ...props }: ToggletipProps) => {
  return (
    <GrafanaToggletip content={<ContentWrapper className={contentClassName}>{content}</ContentWrapper>} {...props}>
      {children}
    </GrafanaToggletip>
  );
};

type ContentWrapperProps = {
  children: ReactNode;
  className?: string;
};

const ContentWrapper = ({ children, className }: ContentWrapperProps) => {
  const styles = useStyles2(getStyles);

  return <div className={cx(styles.toggletipCard, className)}>{children}</div>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  toggletipCard: css({
    margin: theme.spacing(-1, 0, -1, 0),
    paddingRight: theme.spacing(2),
    lineHeight: theme.typography.body.lineHeight,
  }),
});
