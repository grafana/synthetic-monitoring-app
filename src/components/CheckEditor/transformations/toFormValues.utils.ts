import { SelectableValue } from '@grafana/data';

import { Check, CheckFormValues, TLSConfig } from 'types';
import { fromBase64 } from 'utils';
import {
  GLOBAL_PREDEFINED_ALERTS,
  PredefinedAlertInterface,
} from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

export function selectableValueFrom<T>(value: T, label?: string): SelectableValue<T> {
  const labelValue = String(value);
  return { label: label ?? labelValue, value };
}

export const getTlsConfigFormValues = (tlsConfig?: TLSConfig) => {
  if (!tlsConfig || Object.keys(tlsConfig).length === 0) {
    return {};
  }

  return {
    tlsConfig: {
      ...tlsConfig,
      caCert: getDecodedIfPEM(tlsConfig.caCert),
      clientCert: getDecodedIfPEM(tlsConfig.clientCert),
      clientKey: getDecodedIfPEM(tlsConfig.clientKey),
    },
  };
};

const getDecodedIfPEM = (cert = '') => {
  const decoded = fromBase64(cert);
  if (decoded === undefined) {
    return cert;
  }
  if (decoded.indexOf('BEGIN') > 0) {
    return decoded;
  }
  return cert;
};

export function getBaseFormValuesFromCheck(check: Check): Omit<CheckFormValues, 'checkType' | 'settings'> {
  return {
    alertSensitivity: check.alertSensitivity,
    publishAdvancedMetrics: !check.basicMetricsOnly,
    enabled: check.enabled,
    frequency: check.frequency,
    id: check.id,
    job: check.job,
    labels: check.labels,
    probes: check.probes,
    target: check.target,
    timeout: check.timeout,
    alerts: predefinedAlertsToFormValues(GLOBAL_PREDEFINED_ALERTS),
  };
}

export function predefinedAlertsToFormValues(predefinedAlerts: PredefinedAlertInterface[]) {
  return Object.values(predefinedAlerts).reduce((acc, alert) => {
    return {
      ...acc,
      [alert.type]: alert.defaultValues,
    };
  }, {});
}
