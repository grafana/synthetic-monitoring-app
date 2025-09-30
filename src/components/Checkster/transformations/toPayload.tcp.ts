import { CheckFormValuesTcp, TCPCheck, TCPQueryResponse, TcpSettings, TcpSettingsFormValues } from 'types';
import { toBase64 } from 'utils';
import { FALLBACK_CHECK_TCP } from 'components/constants';

import { getBasePayloadValuesFromForm, getTlsConfigFromFormValues } from './toPayload.utils';

export function getTCPPayload(formValues: CheckFormValuesTcp): TCPCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      tcp: getTcpSettings(formValues.settings.tcp),
    },
  };
}

const getTcpSettings = (settings: TcpSettingsFormValues): TcpSettings => {
  const fallbackValues = FALLBACK_CHECK_TCP.settings.tcp;

  const tlsConfig = getTlsConfigFromFormValues(settings.tlsConfig);
  const queryResponse = getTcpQueryResponseFromFormFields(settings.queryResponse || []);

  return {
    ...fallbackValues,
    ...tlsConfig,
    tls: settings.tls,
    ipVersion: settings.ipVersion ?? fallbackValues.ipVersion,
    queryResponse,
  };
};

const getTcpQueryResponseFromFormFields = (queryResponses: TCPQueryResponse[]) => {
  return queryResponses.map(({ send, expect, startTLS }) => {
    return {
      startTLS,
      send: toBase64(send),
      expect: toBase64(expect),
    };
  });
};
