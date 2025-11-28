import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

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
    return <LoadingPlaceholder text="Loading..." />;
  }

  return (
    <AppContainerProvider value={{ containerProps, primaryProps, secondaryProps, splitterProps }}>
      <div className={cx(styles.wrapper, styles.fadeIn)}>
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
  const fadeId = keyframes`
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  `;

  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
      min-height: 100%;
      position: relative;
    `,
    fadeIn: css`
      opacity: 0;
      animation: ${fadeId};
      animation-delay: 0.1s;
      animation-iteration-count: 1;
      animation-duration: 0.15s;
      animation-fill-mode: forwards;
      animation-timing-function: ease-in;
    `,
    container: css`
      min-height: 100%;
      border: 1px solid ${theme.colors.border.medium};
    `,
  };
}
