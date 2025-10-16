import { encode } from 'js-base64';

import { BrowserCheck, CheckFormValuesBrowser } from 'types';

import { getBasePayloadValuesFromForm } from './toPayload.utils';

export function getBrowserPayload(formValues: CheckFormValuesBrowser): BrowserCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      browser: {
        script: encode(formValues.settings.browser.script),
      },
    },
  };
}
