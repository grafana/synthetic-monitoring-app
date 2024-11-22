import React, { Fragment, PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, useStyles2 } from '@grafana/ui';
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
    <section data-testid={DataTestIds.CONFIG_CONTENT} className={styles.container}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    // Take down the size a notch without disturbing the a11y
    '& > section > h2': {
      ...theme.typography.h3,
    },
    '& > section > h3': {
      ...theme.typography.h4,
    },
    '& > section > h4': {
      ...theme.typography.h5,
    },
  }),
});

ConfigContent.Section = function ConfigContentSection({
  title,
  children,
  className,
}: PropsWithChildren<{ title?: ReactNode; className?: string }>) {
  const Container = className ? 'div' : Fragment;

  return (
    <Box marginBottom={4} element="section">
      {!!title && <h3>{title}</h3>}
      <Container className={className}>{children}</Container>
    </Box>
  );
};
