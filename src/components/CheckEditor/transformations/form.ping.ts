import { CheckFormValuesPing, CheckType, PingCheck, PingSettingsFormValues } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/form.utils';
import { FALLBACK_CHECK_PING, IP_OPTIONS } from 'components/constants';

export function getPingCheckFormValues(check: PingCheck): CheckFormValuesPing {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.PING,
    settings: {
      ping: getPingSettingsFormValues(check.settings),
    },
  };
}

const getPingSettingsFormValues = (settings: PingCheck['settings']): PingSettingsFormValues => {
  const pingSettings = settings.ping ?? FALLBACK_CHECK_PING.settings.ping;

  return {
    ...pingSettings,
    ipVersion: IP_OPTIONS.find(({ value }) => value === settings?.ping?.ipVersion) ?? IP_OPTIONS[1],
  };
};
