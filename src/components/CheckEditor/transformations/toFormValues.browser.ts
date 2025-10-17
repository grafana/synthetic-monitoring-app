import { decode } from 'js-base64';

import { BrowserCheck, CheckFormValuesBrowser, CheckType } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';

export function getBrowserCheckFormValues(
  check: BrowserCheck,
  defaultChannelId?: string
): CheckFormValuesBrowser {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.Browser,
    settings: {
      browser: {
        script: decode(check.settings?.browser?.script),
        channel: check.settings?.browser?.channel || defaultChannelId || null,
      },
    },
  };
}
