import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { AppContainerProvider, useAppContainerContext } from '../../contexts/AppContainerContext';
import { useAppSplitter } from './AppContainer.hooks';

interface AppContainerProps extends PropsWithChildren {
  isLoading?: boolean;
  error?: Error;
}

export function AppContainer({ children, isLoading, error }: AppContainerProps) {
  const styles = useStyles2(getStyles);
  const { containerProps, primaryProps, secondaryProps, splitterProps } = useAppSplitter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AppContainerProvider value={{ containerProps, primaryProps, secondaryProps, splitterProps }}>
      <div className={styles.wrapper}>
        {!!error && (
          <Alert title={error?.name ?? 'Error'} severity="error">
            {error && error.message ? error.message : 'Unknown error'}
          </Alert>
        )}
        <Container>{children}</Container>
      </div>
    </AppContainerProvider>
  );
}

function Container({ children }: PropsWithChildren) {
  const styles = useStyles2(getStyles);
  const {
    containerProps: { className, ...rest },
  } = useAppContainerContext();
  return (
    <div className={cx(className, styles.container)} {...rest}>
      {children}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    `,
    container: css`
      height: 100%;
      border: 1px solid ${theme.colors.border.medium};
    `,
  };
}
