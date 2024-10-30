import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { OverLimitAlert } from 'components/OverLimitAlert';

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

const getStyles = (theme: GrafanaTheme2) => {
  const twoColumnsQuery = `@media (max-width: ${theme.breakpoints.values.xxl}px)`;
  const oneColumnQuery = `@media (max-width: ${theme.breakpoints.values.sm}px)`;
  return {
    container: css({
      width: `100%`,
      display: `grid`,
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing(2),
      textAlign: `center`,
      color: theme.colors.text.secondary,

      [twoColumnsQuery]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },

      [oneColumnQuery]: {
        gridTemplateColumns: '1fr',
      },
    }),
  };
};
