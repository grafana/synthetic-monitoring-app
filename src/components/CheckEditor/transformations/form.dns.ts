import { SelectableValue } from '@grafana/data';

import {
  CheckFormValuesDns,
  CheckType,
  DNSCheck,
  DNSRRValidator,
  DnsSettingsFormValues,
  DnsValidationFormValue,
  ResponseMatchType,
} from 'types';
import { getBaseFormValuesFromCheck, selectableValueFrom } from 'components/CheckEditor/transformations/form.utils';
import { DNS_RESPONSE_CODES, DNS_RESPONSE_MATCH_OPTIONS, FALLBACK_CHECK_DNS } from 'components/constants';

export function getDNSCheckFormValues(check: DNSCheck): CheckFormValuesDns {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.DNS,
    settings: {
      dns: getDnsSettingsFormValues(check.settings),
    },
  };
}

const getDnsSettingsFormValues = (settings: DNSCheck['settings']): DnsSettingsFormValues => {
  const dnsSettings = settings.dns ?? FALLBACK_CHECK_DNS.settings.dns;

  return {
    ...dnsSettings,
    ipVersion: selectableValueFrom(dnsSettings.ipVersion),
    protocol: selectableValueFrom(dnsSettings.protocol),
    recordType: selectableValueFrom(dnsSettings.recordType),
    validRCodes:
      (dnsSettings.validRCodes
        ?.map((responseCode) => DNS_RESPONSE_CODES.find((option) => option.value === responseCode))
        .filter(Boolean) as Array<SelectableValue<string>>) ?? [],
    validations: getDnsValidations({
      [ResponseMatchType.Answer]: dnsSettings.validateAnswerRRS,
      [ResponseMatchType.Authority]: dnsSettings.validateAuthorityRRS,
      [ResponseMatchType.Additional]: dnsSettings.validateAditionalRRS,
    }),
  };
};

type GetDnsValidationArgs = { [key in ResponseMatchType]: DNSRRValidator | undefined };

const getDnsValidations = (validations: GetDnsValidationArgs): DnsValidationFormValue[] =>
  Object.keys(validations).reduce<DnsValidationFormValue[]>((formValues, validationType) => {
    const responseMatch = validationType as ResponseMatchType;
    validations[responseMatch]?.failIfMatchesRegexp?.forEach((expression) => {
      formValues.push({
        expression,
        inverted: false,
        responseMatch:
          DNS_RESPONSE_MATCH_OPTIONS.find(({ value }) => value === responseMatch) ?? DNS_RESPONSE_MATCH_OPTIONS[0],
      });
    });

    validations[responseMatch]?.failIfNotMatchesRegexp?.forEach((expression) => {
      formValues.push({
        expression,
        inverted: true,
        responseMatch:
          DNS_RESPONSE_MATCH_OPTIONS.find(({ value }) => value === responseMatch) ?? DNS_RESPONSE_MATCH_OPTIONS[0],
      });
    });
    return formValues;
  }, []);
