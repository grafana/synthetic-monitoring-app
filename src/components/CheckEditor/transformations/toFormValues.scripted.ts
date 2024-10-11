import { decode } from 'js-base64';

import { CheckFormValuesScripted, CheckType, ScriptedCheck } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';

export function getScriptedCheckFormValues(check: ScriptedCheck): CheckFormValuesScripted {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.Scripted,
    settings: {
      scripted: {
        script: decode(check.settings?.scripted?.script),
      },
    },
  };
}
