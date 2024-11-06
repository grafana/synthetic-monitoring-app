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
      <div className={styles.wrapper}>
        <Stack direction="column" gap={2}>
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
      </div>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = `checkGroupContainer`;
  const oneColQuery = `(max-width: ${theme.breakpoints.values.sm}px)`;
  const twoColsQuery = `(max-width: ${theme.breakpoints.values.xxl}px)`;

  const containerOneColQuery = `@container ${containerName} ${oneColQuery}`;
  const containerTwoColsQuery = `@container ${containerName} ${twoColsQuery}`;
  const oneColMediaQuery = `@supports not (container-type: inline-size) @media ${oneColQuery}`;
  const twoColsMediaQuery = `@supports not (container-type: inline-size) @media ${twoColsQuery}`;

  const containerRules = {
    twoCols: `repeat(2, 1fr)`,
    oneCol: '1fr',
  };

  return {
    wrapper: css({
      containerName,
      containerType: `inline-size`,
      height: '100%',
      contain: 'layout',
    }),

    container: css({
      width: `100%`,
      display: `grid`,
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing(2),
      textAlign: `center`,
      color: theme.colors.text.secondary,

      [twoColsMediaQuery]: {
        gridTemplateColumns: containerRules.twoCols,
      },
      [containerTwoColsQuery]: {
        gridTemplateColumns: containerRules.twoCols,
      },

      [oneColMediaQuery]: {
        gridTemplateColumns: containerRules.oneCol,
      },
      [containerOneColQuery]: {
        gridTemplateColumns: containerRules.oneCol,
      },
    }),
  };
};
