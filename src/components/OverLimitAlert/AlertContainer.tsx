import React, { PropsWithChildren } from 'react';
import { Alert, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export const AlertContainer = ({ children, title }: PropsWithChildren<{ title: string }>) => {
  const styles = useStyles2(getStyles);

  return (
    <Alert severity="warning" title={title} className={styles.container}>
      {children}
    </Alert>
  );
};

const getStyles = () => ({
  container: css({
    maxWidth: `1648px`,
  }),
});
