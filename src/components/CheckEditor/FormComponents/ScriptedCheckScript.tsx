import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { CheckFormValuesScripted } from 'types';
import { CodeEditor } from 'components/CodeEditor';
import { ScriptExamplesMenu } from 'components/ScriptExamplesMenu/ScriptExamplesMenu';

export const ScriptedCheckScript = () => {
  const { control, setValue, getValues } = useFormContext<CheckFormValuesScripted>();
  const id = getValues('id');

  return (
    <>
      {!id && <ScriptExamplesMenu onSelectExample={(script) => setValue('settings.scripted.script', script)} />}
      <Controller
        name="settings.scripted.script"
        control={control}
        render={({ field }) => {
          return <CodeEditor {...field} />;
        }}
      />
    </>
  );
};
