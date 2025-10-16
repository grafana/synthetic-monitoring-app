import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldValidationMessage, Tab, TabContent, TabsBar } from '@grafana/ui';

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
    getValues,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValuesBrowser>();
  const [selectedTab, setSelectedTab] = React.useState(ScriptEditorTabs.Script);
  const fieldError = errors.settings?.browser?.script;
  const selectedChannel = getValues('settings.browser.channel');

  return (
    <>
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
              return <CodeEditor readOnly={disabled} {...field} k6Channel={selectedChannel || undefined} />;
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
