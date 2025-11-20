import { encode } from 'js-base64';

import { BrowserCheck, CheckFormValuesBrowser } from 'types';

import { getBasePayloadValuesFromForm } from './toPayload.utils';

export function getBrowserPayload(formValues: CheckFormValuesBrowser): BrowserCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  const browserSettings: { script: string; channel?: string } = {
    script: encode(formValues.settings.browser.script),
  };

  // Only include channel if it has a value
  if (formValues.settings.browser.channel) {
    browserSettings.channel = formValues.settings.browser.channel;
  }

  return {
    ...base,
    settings: {
      browser: browserSettings,
    },
  };
}
