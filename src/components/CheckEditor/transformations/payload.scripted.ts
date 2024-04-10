import { CheckFormValuesScripted, ScriptedCheck } from 'types';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/payload.utils';

export function getScriptedPayload(formValues: CheckFormValuesScripted): ScriptedCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      scripted: {
        script: btoa(formValues.settings.scripted.script),
      },
    },
  };
}
