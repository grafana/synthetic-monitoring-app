import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Tab, TabContent, TabsBar } from '@grafana/ui';

import { CheckFormValuesScripted } from 'types';
import { CodeEditor } from 'components/CodeEditor';
import { CodeSnippet } from 'components/CodeSnippet';
import { SCRIPT_EXAMPLES } from 'components/WelcomeTabs/constants';

enum ScriptEditorTabs {
  Script = 'script',
  Examples = 'examples',
}

export const ScriptedCheckScript = () => {
  const { control } = useFormContext<CheckFormValuesScripted>();
  const [selectedTab, setSelectedTab] = React.useState(ScriptEditorTabs.Script);

  return (
    <>
      {/* {!id && <ScriptExamplesMenu onSelectExample={(script) => setValue('settings.scripted.script', script)} />} */}
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
            name="settings.scripted.script"
            control={control}
            render={({ field }) => {
              return <CodeEditor {...field} />;
            }}
          />
        )}
        {selectedTab === ScriptEditorTabs.Examples && (
          <CodeSnippet
            hideHeader
            canCopy={true}
            // className={styles.codeSnippet}
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
        )}
      </TabContent>
    </>
  );
};
