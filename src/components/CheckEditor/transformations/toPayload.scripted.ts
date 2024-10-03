import { encode } from 'js-base64';

import { CheckFormValuesScripted, ScriptedCheck } from 'types';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/toPayload.utils';

export function getScriptedPayload(formValues: CheckFormValuesScripted): ScriptedCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      scripted: {
        script: encode(formValues.settings.scripted.script),
      },
    },
  };
}
