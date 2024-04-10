import { CheckFormValuesPing, PingCheck, PingSettings, PingSettingsFormValues } from 'types';
import {
  getBasePayloadValuesFromForm,
  getValueFromSelectable,
} from 'components/CheckEditor/transformations/payload.utils';
import { FALLBACK_CHECK_PING } from 'components/constants';

export function getPingPayload(formValues: CheckFormValuesPing): PingCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      ping: getPingSettings(formValues.settings.ping),
    },
  };
}

const getPingSettings = (settings: Partial<PingSettingsFormValues> | undefined = {}): PingSettings => {
  const fallbackValues = FALLBACK_CHECK_PING.settings.ping;

  return {
    ...fallbackValues,
    ipVersion: getValueFromSelectable(settings.ipVersion) ?? fallbackValues.ipVersion,
  };
};
