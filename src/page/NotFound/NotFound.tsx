import React, { ReactNode } from 'react';
import { GrafanaTheme2, NavModelItem, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { EmptyState, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface NotFoundProps {
  message?: string;
  children?: ReactNode;
}

export function NotFound({ message = 'Not found', children = null }: NotFoundProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <EmptyState message={message} variant="not-found">
        {children}
      </EmptyState>
    </div>
  );
}

interface PluginPageNotFoundProps extends NotFoundProps {
  navModel?: NavModelItem;
  breadcrumb?: string;
}
export function PluginPageNotFound({
  navModel,
  breadcrumb = '404 - Not found',
  ...notFoundProps
}: PluginPageNotFoundProps) {
  return (
    <PluginPage layout={PageLayoutType.Canvas} pageNav={navModel ?? { text: breadcrumb }}>
      <NotFound {...notFoundProps} />
    </PluginPage>
  );
}

export function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      padding: theme.spacing(8, 2, 2, 2),
    }),
  };
}
