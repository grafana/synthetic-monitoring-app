import { CheckFormValuesPing, CheckType, PingCheck, PingSettingsFormValues } from 'types';
import { PING_PREDEFINED_ALERTS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';
import { FALLBACK_CHECK_PING } from 'components/constants';

import { getBaseFormValuesFromCheck, predefinedAlertsToFormValues } from './toFormValues.utils';

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
      ...predefinedAlertsToFormValues(PING_PREDEFINED_ALERTS, check.alerts || []),
    },
  };
}

const getPingSettingsFormValues = (settings: PingCheck['settings']): PingSettingsFormValues => {
  return {
    dontFragment: settings.ping.dontFragment ?? FALLBACK_CHECK_PING.settings.ping.dontFragment,
    ipVersion: settings.ping?.ipVersion ?? FALLBACK_CHECK_PING.settings.ping.ipVersion,
  };
};
