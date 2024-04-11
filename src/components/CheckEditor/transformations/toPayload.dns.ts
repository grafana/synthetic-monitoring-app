import {
  CheckFormValuesDns,
  DNSCheck,
  DnsSettings,
  DnsSettingsFormValues,
  DnsValidationFormValue,
  ResponseMatchType,
} from 'types';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/toPayload.utils';
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
    recordType: settings.recordType ?? fallbackValues.recordType,
    server: settings.server ?? fallbackValues.server,
    ipVersion: settings.ipVersion ?? fallbackValues.ipVersion,
    protocol: settings.protocol ?? fallbackValues.protocol,
    port: Number(settings.port) ?? fallbackValues.port,
    validRCodes: settings.validRCodes ?? fallbackValues.validRCodes,
    ...validations,
  };
}

type DnsValidations = Pick<DnsSettings, 'validateAdditionalRRS' | 'validateAnswerRRS' | 'validateAuthorityRRS'>;

const getDnsValidationsFromFormValues = (validations: DnsValidationFormValue[]): DnsValidations =>
  validations.reduce<DnsValidations>(
    (acc, validation) => {
      const destinationName = validation.inverted ? 'failIfNotMatchesRegexp' : 'failIfMatchesRegexp';

      switch (validation.responseMatch) {
        case ResponseMatchType.Additional:
          acc.validateAdditionalRRS![destinationName].push(validation.expression);
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
      validateAdditionalRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
    }
  );
