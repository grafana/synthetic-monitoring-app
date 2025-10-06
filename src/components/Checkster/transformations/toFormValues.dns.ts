import {
  CheckFormValuesDns,
  CheckType,
  DNSCheck,
  DnsSettings,
  DnsSettingsFormValues,
  DnsValidationFormValue,
  ResponseMatchType,
} from 'types';
import { FALLBACK_CHECK_DNS } from 'components/constants';

import { DNS_PREDEFINED_ALERTS } from '../components/form/generic/GenericAlertingField/AlertsPerCheck/AlertsPerCheck.constants';
import { getBaseFormValuesFromCheck, predefinedAlertsToFormValues } from './toFormValues.utils';

export function getDNSCheckFormValues(check: DNSCheck): CheckFormValuesDns {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.DNS,
    settings: {
      dns: getDnsSettingsFormValues(check.settings),
    },
    alerts: {
      ...base.alerts,
      ...predefinedAlertsToFormValues(DNS_PREDEFINED_ALERTS, check.alerts || []),
    },
  };
}

const getDnsSettingsFormValues = (settings: DNSCheck['settings']): DnsSettingsFormValues => {
  const dnsSettings = settings.dns ?? FALLBACK_CHECK_DNS.settings.dns;

  return {
    ...dnsSettings,
    validations: getDnsValidations(dnsSettings),
  };
};

const getDnsValidations = (dnsSettings: DnsSettings) => {
  const build: DnsValidationFormValue[] = [];

  (dnsSettings.validateAnswerRRS?.failIfMatchesRegexp ?? []).forEach((expression) => {
    build.push({
      responseMatch: ResponseMatchType.Answer,
      expression,
      inverted: false,
    });
  });

  (dnsSettings.validateAnswerRRS?.failIfNotMatchesRegexp ?? []).forEach((expression) => {
    build.push({
      responseMatch: ResponseMatchType.Answer,
      expression,
      inverted: true,
    });
  });

  (dnsSettings.validateAuthorityRRS?.failIfMatchesRegexp ?? []).forEach((expression) => {
    build.push({
      responseMatch: ResponseMatchType.Authority,
      expression,
      inverted: false,
    });
  });

  (dnsSettings.validateAuthorityRRS?.failIfNotMatchesRegexp ?? []).forEach((expression) => {
    build.push({
      responseMatch: ResponseMatchType.Authority,
      expression,
      inverted: true,
    });
  });

  (dnsSettings.validateAdditionalRRS?.failIfMatchesRegexp ?? []).forEach((expression) => {
    build.push({
      responseMatch: ResponseMatchType.Additional,
      expression,
      inverted: false,
    });
  });

  (dnsSettings.validateAdditionalRRS?.failIfNotMatchesRegexp ?? []).forEach((expression) => {
    build.push({
      responseMatch: ResponseMatchType.Additional,
      expression,
      inverted: true,
    });
  });

  return build;
};
