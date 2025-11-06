import React, { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldValidationMessage, Tab, TabContent, TabsBar } from '@grafana/ui';

import { CheckFormValuesScripted } from 'types';
import { CodeEditor } from 'components/CodeEditor';
import { CodeSnippet } from 'components/CodeSnippet';
import { CHECK_FORM_ERROR_EVENT } from 'components/constants';
import { SCRIPT_EXAMPLES } from 'components/WelcomeTabs/constants';

enum ScriptEditorTabs {
  Script = 'script',
  Examples = 'examples',
}

export const SCRIPT_TEXTAREA_ID = 'check-script-textarea';

export const ScriptedCheckScript = () => {
  const {
    control,
    formState: { errors, disabled: isFormDisabled },
  } = useFormContext<CheckFormValuesScripted>();
  const [selectedTab, setSelectedTab] = useState(ScriptEditorTabs.Script);
  const fieldError = errors.settings?.scripted?.script;

  useEffect(() => {
    const goToScriptTab = () => {
      if (fieldError) {
        setSelectedTab(ScriptEditorTabs.Script);
      }
    };

    document.addEventListener(CHECK_FORM_ERROR_EVENT, goToScriptTab);

    return () => {
      document.removeEventListener(CHECK_FORM_ERROR_EVENT, goToScriptTab);
    };
  }, [fieldError]);

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
            name="settings.scripted.script"
            control={control}
            render={({ field }) => {
              return <CodeEditor {...field} id={SCRIPT_TEXTAREA_ID} readOnly={isFormDisabled} />;
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
        {fieldError && <FieldValidationMessage>{fieldError.message}</FieldValidationMessage>}
      </TabContent>
    </>
  );
};
