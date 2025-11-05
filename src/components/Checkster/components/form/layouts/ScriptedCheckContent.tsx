import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, TextLink, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from '../../../../../types';

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
  const [showK6Info, setShowK6Info] = useState(true);

  // Determine if this is a browser check or scripted check based on the scriptField
  const isBrowserCheck = scriptField === 'settings.browser.script';
  const docsLink = isBrowserCheck
    ? 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/k6-browser/'
    : 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/k6/';

  return (
    <SectionContent noWrapper>
      <Column gap={FIELD_SPACING} padding={theme.spacing(0, 2)}>
        <FormJobField field="job" />
        <FormInstanceField field="target" />
      </Column>
      <Column fill>
        {showK6Info && (
          <div style={{ marginBottom: theme.spacing(2) }}>
            <Alert severity="info" title="Grafana k6 Script" onRemove={() => setShowK6Info(false)}>
              Scripted checks are built on top of Grafana k6. Read{' '}
              <TextLink href={docsLink} external>
                here
              </TextLink>{' '}
              for more information on getting started. <br />You can also save time by using{' '}
              <TextLink href="https://grafana.com/docs/k6-studio/record-your-first-script/" external>
                k6 Studio
              </TextLink>{' '}
              to record a user flow to create a test script.
            </Alert>
          </div>
        )}
        <FormTabs>
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
