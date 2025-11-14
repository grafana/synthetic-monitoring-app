import { decode } from 'js-base64';

import { BrowserCheck, CheckFormValuesBrowser, CheckType } from 'types';

import { getBaseFormValuesFromCheck } from './toFormValues.utils';

export function getBrowserCheckFormValues(check: BrowserCheck): CheckFormValuesBrowser {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.Browser,
    settings: {
      browser: {
        script: decode(check.settings?.browser?.script),
        channel: check.settings?.browser?.channel || null,
      },
    },
  };
}
