import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export const Ul = ({ children }: PropsWithChildren) => {
  const styles = useStyles2(getStyles);

  return <ul className={styles.ul}>{children}</ul>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  ul: css({
    listStyleType: 'initial',
    paddingLeft: theme.spacing(2),
  }),
});
