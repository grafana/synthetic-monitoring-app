import { CheckFormValuesTcp, CheckType, TCPCheck, TCPQueryResponse, TcpSettingsFormValues } from 'types';
import { fromBase64 } from 'utils';
import {
  getBaseFormValuesFromCheck,
  getTlsConfigFormValues,
} from 'components/CheckEditor/transformations/toFormValues.utils';
import { FALLBACK_CHECK_TCP } from 'components/constants';

export function getTCPCheckFormValues(check: TCPCheck): CheckFormValuesTcp {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.TCP,
    settings: {
      tcp: getTcpSettingsFormValues(check.settings),
    },
  };
}

const getTcpSettingsFormValues = (settings: TCPCheck['settings']): TcpSettingsFormValues => {
  const tcpSettings = settings.tcp ?? FALLBACK_CHECK_TCP.settings.tcp;
  const formattedQueryResponse = getTcpQueryResponseFormValues(tcpSettings.queryResponse || []);
  const tlsConfig = getTlsConfigFormValues(tcpSettings.tlsConfig);

  return {
    ...tcpSettings,
    ...tlsConfig,
    queryResponse: formattedQueryResponse,
  };
};

const getTcpQueryResponseFormValues = (queryResponses: TCPQueryResponse[]) => {
  return queryResponses.map(({ send, expect, startTLS }) => ({
    startTLS,
    send: fromBase64(send),
    expect: fromBase64(expect),
  }));
};
