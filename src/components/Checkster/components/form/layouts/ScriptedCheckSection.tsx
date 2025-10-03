import React from 'react';
import { Icon, Stack, Tooltip, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CodeSnippet } from 'components/CodeSnippet';
import { SCRIPT_EXAMPLES } from 'components/WelcomeTabs/constants';

import { FIELD_SPACING } from '../../../constants';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericInputField } from '../generic/GenericInputField';
import { GenericScriptField } from '../generic/GenericScriptField';

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckSection({ label }: { label: string }) {
  const theme = useTheme2();
  return (
    <SectionContent label={label} vanilla>
      <Column gap={FIELD_SPACING} padding={theme.spacing(0, 2)}>
        <FormJobField field="job" />
        <GenericInputField
          field="target"
          label="Instance"
          description={
            <Stack gap={1}>
              <span>
                Metrics and logs produced as a result of this check will follow the Prometheus convention of being
                identified by a job and instance.
              </span>
              <Tooltip
                content={
                  <span>
                    The job/instance pair is guaranteed unique and the method by which results are queried. Read more
                    about the job/instance convention at prometheus.io
                  </span>
                }
              >
                <Icon
                  color="primary"
                  name="info-circle"
                  className={css`
                    font-weight: ${theme.typography.fontWeightLight};
                  `}
                />
              </Tooltip>
            </Stack>
          }
          required
        />
      </Column>
      <Column fill>
        <FormTabs>
          <FormTabContent label="Script" fillVertical vanilla>
            <GenericScriptField field="settings.scripted.script" />
          </FormTabContent>
          <FormTabContent
            label="Examples"
            fillVertical
            className={css`
              // Handle code snippet border
              & > div,
              & > div > div {
                border: none;
              }
            `}
          >
            <CodeSnippet
              hideHeader
              canCopy={true}
              tabs={[
                {
                  value: 'Example scripts',
                  label: '',
                  groups: SCRIPT_EXAMPLES.map(({ label, script }) => ({
                    value: label,
                    label,
                    code: script,
                    lang: 'js',
                  })),
                },
              ]}
              dedent={true}
              lang="js"
            />
          </FormTabContent>
        </FormTabs>
      </Column>
    </SectionContent>
  );
}
