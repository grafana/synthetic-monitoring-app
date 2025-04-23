import React, { Fragment, PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CenteredSpinner } from 'components/CenteredSpinner';

interface BaseProps {
  loading?: boolean;
  children?: ReactNode;
  ariaLoadingLabel?: string;
  'data-testid'?: string;
}

interface WithoutActions {
  title?: ReactNode;
  actions?: never;
}

interface WithActions {
  title: ReactNode;
  actions?: ReactNode;
}

type Props = BaseProps & (WithoutActions | WithActions);

export function ConfigContent({
  title,
  children,
  loading = false,
  actions,
  ariaLoadingLabel = 'Loading...',
  ...props
}: Props) {
  const styles = useStyles2(getStyles);

  if (loading) {
    return (
      <div
        data-testid={cx(DataTestIds.CONFIG_CONTENT_LOADING, props['data-testid'])}
        className={styles.container}
        aria-busy
      >
        <CenteredSpinner aria-label={ariaLoadingLabel} />
      </div>
    );
  }

  return (
    <section data-testid={DataTestIds.CONFIG_CONTENT} className={styles.container}>
      {title && (
        <div className={styles.heading}>
          <h2>{title}</h2>
          {actions}
        </div>
      )}
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
  heading: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
});

ConfigContent.Section = function ConfigContentSection({
  title,
  children,
  className,
}: PropsWithChildren<{ title?: ReactNode; className?: string }>) {
  const Container = className ? 'div' : Fragment;
  const props = className ? { className } : {};

  return (
    <Box marginBottom={4} element="section">
      {!!title && <h3>{title}</h3>}
      <Container {...props}>{children}</Container>
    </Box>
  );
};
