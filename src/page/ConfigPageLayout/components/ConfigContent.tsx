import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CenteredSpinner } from 'components/CenteredSpinner';

export interface ConfigContentProps extends PropsWithChildren {
  title?: NonNullable<ReactNode>;
  loading?: boolean;
}

export function ConfigContent({ title, children, loading = false }: ConfigContentProps) {
  const styles = useStyles2(getStyles);

  if (loading) {
    return (
      <div data-testid={DataTestIds.CONFIG_CONTENT_LOADING} className={styles.container}>
        <CenteredSpinner />
      </div>
    );
  }

  return (
    <div data-testid={DataTestIds.CONFIG_CONTENT} className={styles.container}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
  }),
});

ConfigContent.Section = function ConfigContentSection({ children }: PropsWithChildren<{}>) {
  const styles = useStyles2(sectionStyles);
  return <div className={styles.section}>{children}</div>;
};

const sectionStyles = (theme: GrafanaTheme2) => ({
  section: css({
    marginBottom: theme.spacing(2),
  }),
});
