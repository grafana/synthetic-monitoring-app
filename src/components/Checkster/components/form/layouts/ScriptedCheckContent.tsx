import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from '../../../../../types';
import { useFeatureTabsContext } from 'components/Checkster/contexts/FeatureTabsContext';
import { PlainButton } from 'components/PlainButton';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { SCRIPT_EXAMPLES } from '../../../../WelcomeTabs/constants';
import { FIELD_SPACING } from '../../../constants';
import { ScriptExamples } from '../../ScriptExamples';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { FormInstanceField } from '../FormInstanceField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericScriptField } from '../generic/GenericScriptField';

interface ScriptedCheckSectionProps {
  scriptField?: `settings.${CheckType.Scripted | CheckType.Browser}.script`;
  examples?: ExampleScript[];
}

export const SCRIPTED_CHECK_FIELDS = ['job', 'target', 'settings.scripted.script'];

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckContent({
  examples = SCRIPT_EXAMPLES,
  scriptField = 'settings.scripted.script',
}: ScriptedCheckSectionProps) {
  const theme = useTheme2();
  const hasExamples = examples && examples?.length > 0;
  const styles = useStyles2(getStyles);

  return (
    <SectionContent noWrapper>
      <Column gap={FIELD_SPACING} padding={theme.spacing(0, 2)}>
        <FormJobField field="job" />
        <FormInstanceField field="target" />
      </Column>
      <Column fill>
        <FormTabs actions={<HelpBadge />}>
          <FormTabContent label="Script" fillVertical vanilla>
            <GenericScriptField field={scriptField} />
          </FormTabContent>
          {hasExamples && (
            <FormTabContent label="Examples" fillVertical vanilla className={styles.codeSnippetWrapper}>
              <ScriptExamples examples={examples} />
            </FormTabContent>
          )}
        </FormTabs>
      </Column>
    </SectionContent>
  );
}

const HelpBadge = () => {
  const { setActive } = useFeatureTabsContext();

  return (
    <Tooltip
      content="Synthetic Monitoring scripts are built on top of Grafana k6. Click to learn more about authoring scripts."
      interactive
    >
      <PlainButton type="button" onClick={() => setActive('Docs')}>
        <Badge
          color="blue"
          icon="k6"
          text={
            <Stack direction="row" gap={0.5} alignItems="center">
              About k6 scripts
            </Stack>
          }
        />
      </PlainButton>
    </Tooltip>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    codeSnippetWrapper: css`
      // Handle code snippet border
      & > div,
      & > div > div {
        border: none;
      }

      // Change code snippet menu background
      & section > div > div {
        background-color: ${theme.colors.background.primary};
      }
    `,
  };
}
