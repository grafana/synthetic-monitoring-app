import { CheckFormValuesPing, CheckType, PingCheck, PingSettingsFormValues } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';
import { FALLBACK_CHECK_PING } from 'components/constants';

export function getPingCheckFormValues(check: PingCheck): CheckFormValuesPing {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.PING,
    settings: {
      ping: getPingSettingsFormValues(check.settings),
    },
    alerts: {
      ...base.alerts,
    },
  };
}

const getPingSettingsFormValues = (settings: PingCheck['settings']): PingSettingsFormValues => {
  return {
    dontFragment: settings.ping.dontFragment ?? FALLBACK_CHECK_PING.settings.ping.dontFragment,
    ipVersion: settings.ping?.ipVersion ?? FALLBACK_CHECK_PING.settings.ping.ipVersion,
  };
};
