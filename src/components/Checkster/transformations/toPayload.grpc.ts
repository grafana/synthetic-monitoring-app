import { CheckFormValuesGRPC, GRPCCheck, GRPCSettings, GRPCSettingsFormValues } from 'types';
import { FALLBACK_CHECK_GRPC } from 'components/constants';

import { getBasePayloadValuesFromForm, getTlsConfigFromFormValues } from './toPayload.utils';

export function getGRPCPayload(formValues: CheckFormValuesGRPC): GRPCCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      grpc: getGRPCSettings(formValues.settings.grpc),
    },
  };
}

function getGRPCSettings(settings: Partial<GRPCSettingsFormValues> | undefined = {}): GRPCSettings {
  const fallbackValues = FALLBACK_CHECK_GRPC.settings.grpc;
  const tlsConfig = getTlsConfigFromFormValues(settings.tlsConfig);

  return {
    ...fallbackValues,
    ipVersion: settings.ipVersion ?? fallbackValues.ipVersion,
    service: settings.service ?? fallbackValues.service,
    tls: settings.tls ?? fallbackValues.tls,
    ...tlsConfig,
  };
}
