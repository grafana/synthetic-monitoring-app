import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Alert, Tab, TabContent, TabsBar, TextLink } from '@grafana/ui';
import { FieldValidationMessage } from '@grafana/ui';

import { CheckFormValuesBrowser } from 'types';
import { CodeEditor } from 'components/CodeEditor';
import { CodeSnippet } from 'components/CodeSnippet';
import { BROWSER_EXAMPLES } from 'components/WelcomeTabs/constants';

enum ScriptEditorTabs {
  Script = 'script',
  Examples = 'examples',
}

export const BrowserCheckScript = () => {
  const {
    control,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValuesBrowser>();
  const [selectedTab, setSelectedTab] = React.useState(ScriptEditorTabs.Script);
  const [showK6Info, setShowK6Info] = React.useState(true);
  const fieldError = errors.settings?.browser?.script;

  return (
    <>
      {showK6Info && (
        <Alert severity="info" title="Grafana k6 Script" onRemove={() => setShowK6Info(false)}>
          Scripted checks are built on top of Grafana k6. Read{' '}
          <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/k6-browser/" external>
            here
          </TextLink>{' '}
          for more information on getting started. <br />You can also save time by using{' '}
          <TextLink href="https://grafana.com/docs/k6-studio/record-your-first-script/" external>
            k6 Studio
          </TextLink>{' '}
          to record a user flow to create a test script.
        </Alert>
      )}
      <TabsBar>
        <Tab
          label="Script"
          onChangeTab={() => setSelectedTab(ScriptEditorTabs.Script)}
          active={selectedTab === ScriptEditorTabs.Script}
        />
        <Tab
          label="Examples"
          onChangeTab={() => setSelectedTab(ScriptEditorTabs.Examples)}
          active={selectedTab === ScriptEditorTabs.Examples}
        />
      </TabsBar>
      <TabContent>
        {selectedTab === ScriptEditorTabs.Script && (
          <Controller
            name="settings.browser.script"
            control={control}
            render={({ field }) => {
              return <CodeEditor readOnly={disabled} {...field} />;
            }}
          />
        )}
        {selectedTab === ScriptEditorTabs.Examples && (
          <CodeSnippet
            hideHeader
            canCopy={true}
            tabs={[
              {
                value: 'Example scripts',
                label: '',
                groups: BROWSER_EXAMPLES.map(({ label, script }) => ({
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
        )}
        {fieldError && <FieldValidationMessage>{fieldError.message}</FieldValidationMessage>}
      </TabContent>
    </>
  );
};
