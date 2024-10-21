import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';

import { OverLimitAlert } from '../OverLimitAlert';
import { CheckGroupCard } from './CheckGroupCard';

export const ChooseCheckGroup = () => {
  const styles = useStyles2(getStyles);
  const options = useCheckTypeGroupOptions();

  return (
    <PluginPage layout={PageLayoutType.Standard} pageNav={{ text: 'Choose a check type' }}>
      <Stack direction={`column`} gap={2}>
        <div>
          Pick between {options.length} different types of checks to monitor your services. Choose the one that best
          fits your needs.
        </div>
        <OverLimitAlert />
        <div className={styles.container} data-testid={DataTestIds.CHOOSE_CHECK_TYPE}>
          {options.map((group) => {
            return <CheckGroupCard key={group.label} group={group} />;
          })}
        </div>
      </Stack>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: `100%`,
    display: `grid`,
    gridTemplateColumns: `repeat(auto-fit, minmax(200px, 400px))`,
    gap: theme.spacing(2),
    textAlign: `center`,
  }),
});
