import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { AgentSkillPicker } from 'components/AgentSkillReference/AgentSkillPicker';
import { OverLimitAlert } from 'components/OverLimitAlert';

import { CheckGroupCard } from './components/CheckGroupCard';
import { CheckTemplate } from './components/CheckTemplate';
import { CHECK_TEMPLATES } from './components/checkTemplates';

export const ChooseCheckGroup = () => {
  const styles = useStyles2(getStyles);
  const options = useCheckTypeGroupOptions();

  return (
    <PluginPage layout={PageLayoutType.Standard} pageNav={{ text: 'Create a new check' }}>
      <div className={styles.wrapper}>
        <Stack direction="column" gap={2}>
          <div>
            Pick between {options.length} different types of checks to monitor your services. Choose the one that best
            fits your needs.
          </div>
          <OverLimitAlert />
          <div className={cx(styles.container, styles.afterTiles)} data-testid={CHECKS_TEST_ID.form.chooseType}>
            {options.map((group) => {
              return <CheckGroupCard key={group.label} group={group} />;
            })}
          </div>
          <div>Start from a template</div>
          <div className={cx(styles.container, styles.afterTiles)}>
            {CHECK_TEMPLATES.map((template) => (
              <CheckTemplate key={template.id} template={template} />
            ))}
          </div>
          <AgentSkillPicker source="choose-check-type" />
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
      textAlign: 'left',

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
    afterTiles: css({
      marginBottom: theme.spacing(1),
    }),
  };
};
