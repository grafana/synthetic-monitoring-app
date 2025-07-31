import { CheckFormValuesTcp, CheckType, TCPCheck, TCPQueryResponse, TcpSettingsFormValues } from 'types';
import { fromBase64 } from 'utils';
import {
  getBaseFormValuesFromCheck,
  getTlsConfigFormValues,
  predefinedAlertsToFormValues,
} from 'components/CheckEditor/transformations/toFormValues.utils';
import { TCP_PREDEFINED_ALERTS } from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';
import { FALLBACK_CHECK_TCP } from 'components/constants';

export function getTCPCheckFormValues(check: TCPCheck): CheckFormValuesTcp {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.TCP,
    settings: {
      tcp: getTcpSettingsFormValues(check.settings),
    },
    alerts: {
      ...base.alerts,
      ...predefinedAlertsToFormValues(TCP_PREDEFINED_ALERTS, check.alerts || []),
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
