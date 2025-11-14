import { encode } from 'js-base64';

import { CheckFormValuesScripted, ScriptedCheck } from 'types';

import { getBasePayloadValuesFromForm } from './toPayload.utils';

export function getScriptedPayload(formValues: CheckFormValuesScripted): ScriptedCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  const scriptedSettings: { script: string; channel?: string } = {
    script: encode(formValues.settings.scripted.script),
  };

  // Only include channel if it has a value
  if (formValues.settings.scripted.channel) {
    scriptedSettings.channel = formValues.settings.scripted.channel;
  }

  return {
    ...base,
    settings: {
      scripted: scriptedSettings,
    },
  };
}
