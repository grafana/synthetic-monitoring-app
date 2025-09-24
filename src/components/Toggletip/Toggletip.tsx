import React, { ComponentProps, ReactElement, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Toggletip as GrafanaToggletip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface ToggletipProps extends Omit<ComponentProps<typeof GrafanaToggletip>, 'content'> {
  content: ReactNode;
  children: ReactElement;
}

export const Toggletip = ({ children, content, ...props }: ToggletipProps) => {
  return (
    <GrafanaToggletip content={<ContentWrapper>{content}</ContentWrapper>} {...props}>
      {children}
    </GrafanaToggletip>
  );
};

type ContentWrapperProps = {
  children: ReactNode;
};

const ContentWrapper = ({ children }: ContentWrapperProps) => {
  const styles = useStyles2(getStyles);

  return <div className={styles.toggletipCard}>{children}</div>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  toggletipCard: css({
    margin: theme.spacing(-1, 0, -1, 0),
    paddingRight: theme.spacing(2),
    lineHeight: theme.typography.body.lineHeight,
  }),
});
