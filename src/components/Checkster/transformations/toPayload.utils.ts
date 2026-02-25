import isBase64 from 'is-base64';

import { AlertSensitivity, CheckBase, CheckFormValues, ExistingObject, Label, TLSConfig } from 'types';
import { toBase64 } from 'utils';

function filterAndMapCostAttributionLabels(labels: Label[]): Label[] {
  return labels
    .filter((label) => label.type !== 'cost-attribution' || !!label.value)
    .map(({ name, value }) => ({ name, value }));
}

export function getBasePayloadValuesFromForm(formValues: CheckFormValues): CheckBase & ExistingObject {
  return {
    alertSensitivity: formValues.alertSensitivity ?? AlertSensitivity.None,
    basicMetricsOnly: !formValues.publishAdvancedMetrics,
    enabled: formValues.enabled,
    frequency: formValues.frequency,
    id: formValues.id,
    job: formValues.job,
    labels: filterAndMapCostAttributionLabels(formValues.labels),
    probes: formValues.probes,
    target: formValues.target,
    timeout: formValues.timeout,
    channels: formValues.channels?.k6
      ? {
          k6: {
            id: formValues.channels.k6.id,
          },
        }
      : undefined,
  };
}

export function getTlsConfigFromFormValues(tlsConfig?: TLSConfig) {
  if (!tlsConfig) {
    return {};
  }

  return {
    tlsConfig: {
      clientCert: tlsConfig.clientCert && ensureBase64(tlsConfig.clientCert),
      caCert: tlsConfig.caCert && ensureBase64(tlsConfig.caCert),
      clientKey: tlsConfig.clientKey && ensureBase64(tlsConfig.clientKey),
      insecureSkipVerify: tlsConfig.insecureSkipVerify,
      serverName: tlsConfig.serverName,
    },
  };
}

function ensureBase64(value: string) {
  return isBase64(value, { paddingRequired: true }) ? value : toBase64(value);
}
