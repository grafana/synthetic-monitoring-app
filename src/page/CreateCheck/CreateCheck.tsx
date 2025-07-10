import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { createNavModel } from 'utils';
import { CheckForm } from 'components/CheckForm/CheckForm';

export function CreateCheck() {
  const styles = useStyles2(getStyles);

  const pageNavModel = createNavModel(
    {
      text: 'Create',
    },
    []
  );

  return (
    <PluginPage pageNav={pageNavModel}>
      <div className={styles.wrapper}>
        <CheckForm />
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    paddingTop: theme.spacing(2),
    height: `100%`,
  }),
});
