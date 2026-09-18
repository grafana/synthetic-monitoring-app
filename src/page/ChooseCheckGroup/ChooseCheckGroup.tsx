import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Box, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { FeatureName } from 'types';
import { useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { AgentSkillPicker } from 'components/AgentSkillReference/AgentSkillPicker';
import { OverLimitAlert } from 'components/OverLimitAlert';

import { BrowserCheckTemplate } from './components/BrowserCheckTemplate';
import { BROWSER_CHECK_TEMPLATES } from './components/browserCheckTemplates';
import { CheckGroupCard } from './components/CheckGroupCard';

export const ChooseCheckGroup = () => {
  const styles = useStyles2(getStyles);
  const options = useCheckTypeGroupOptions();
  const { isEnabled: templatesEnabled } = useFeatureFlag(FeatureName.CheckTemplates);

  return (
    <PluginPage layout={PageLayoutType.Standard} pageNav={{ text: 'Choose a check type' }}>
      <div className={styles.wrapper}>
        <Stack direction="column" gap={2}>
          <div>
            Pick between {options.length} different types of checks to monitor your services. Choose the one that best
            fits your needs.
          </div>
          <OverLimitAlert />
          <div className={styles.container} data-testid={CHECKS_TEST_ID.form.chooseType}>
            {options.map((group) => {
              return <CheckGroupCard key={group.label} group={group} />;
            })}
          </div>
          {templatesEnabled && (
            <Box marginTop={2}>
              <Stack direction="column" gap={2}>
                <Text element="h2" variant="h4">Start from a template</Text>
                <div className={styles.templates}>
                  {BROWSER_CHECK_TEMPLATES.map((template) => (
                    <BrowserCheckTemplate key={template.id} template={template} />
                  ))}
                </div>
              </Stack>
            </Box>
          )}
          <Box marginTop={2}>
            <AgentSkillPicker source="choose-check-type" />
          </Box>
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
    templates: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing(2),
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
