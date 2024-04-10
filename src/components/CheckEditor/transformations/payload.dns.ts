import {
  CheckFormValuesDns,
  DNSCheck,
  DnsSettings,
  DnsSettingsFormValues,
  DnsValidationFormValue,
  ResponseMatchType,
} from 'types';
import {
  getBasePayloadValuesFromForm,
  getValueFromSelectable,
  getValuesFromMultiSelectables,
} from 'components/CheckEditor/transformations/payload.utils';
import { FALLBACK_CHECK_DNS } from 'components/constants';

export function getDNSPayload(formValues: CheckFormValuesDns): DNSCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      dns: getDNSSettingsPayload(formValues.settings.dns),
    },
  };
}

function getDNSSettingsPayload(settings: DnsSettingsFormValues): DnsSettings {
  const fallbackValues = FALLBACK_CHECK_DNS.settings.dns;
  const validations = getDnsValidationsFromFormValues(settings.validations);

  return {
    recordType: getValueFromSelectable(settings?.recordType) ?? fallbackValues.recordType,
    server: settings?.server ?? fallbackValues.server,
    ipVersion: getValueFromSelectable(settings?.ipVersion) ?? fallbackValues.ipVersion,
    protocol: getValueFromSelectable(settings?.protocol) ?? fallbackValues.protocol,
    port: Number(settings?.port) ?? fallbackValues.port,
    validRCodes: getValuesFromMultiSelectables(settings?.validRCodes) ?? fallbackValues.validRCodes,
    ...validations,
  };
}

type DnsValidations = Pick<DnsSettings, 'validateAditionalRRS' | 'validateAnswerRRS' | 'validateAuthorityRRS'>;

const getDnsValidationsFromFormValues = (validations: DnsValidationFormValue[]): DnsValidations =>
  validations.reduce<DnsValidations>(
    (acc, validation) => {
      const destinationName = validation.inverted ? 'failIfNotMatchesRegexp' : 'failIfMatchesRegexp';
      const responseMatch = getValueFromSelectable(validation.responseMatch);
      switch (responseMatch) {
        case ResponseMatchType.Additional:
          acc.validateAditionalRRS![destinationName].push(validation.expression);
          break;
        case ResponseMatchType.Answer:
          acc.validateAnswerRRS![destinationName].push(validation.expression);
          break;
        case ResponseMatchType.Authority:
          acc.validateAuthorityRRS![destinationName].push(validation.expression);
          break;
      }
      return acc;
    },
    {
      validateAnswerRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
      validateAuthorityRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
      validateAditionalRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
    }
  );
