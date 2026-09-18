import { Check, CheckAlertPublished, CheckFormValues, Label, TLSConfig } from 'types';
import { fromBase64 } from 'utils';
import {
  GLOBAL_PREDEFINED_ALERTS,
  PredefinedAlertInterface,
} from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

import { isSecretRef } from '../utils/secrets';
import { getCheckAlertsFormValues } from './toFormValues.alerts';

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
  // A secret reference is stored base64-encoded on the wire (like any PEM); decode
  // it back to the literal `${secrets.*}` so the field re-hydrates into secret mode.
  if (isSecretRef(decoded)) {
    return decoded;
  }
  if (decoded.indexOf('BEGIN') > 0) {
    return decoded;
  }
  return cert;
};

// A check stores cost attribution labels alongside custom ones, so the form has to pull them
// apart. `calLabels` always holds one row per configured CAL name, in the tenant's order, because
// the CAL field addresses them positionally — an unset CAL is a blank row, not a missing one.
export function partitionCalLabels(labels: Label[] = [], calNames: string[] = []) {
  const calNameSet = new Set(calNames);

  return {
    calLabels: calNames.map((name) => ({
      name,
      value: labels.find((label) => label.name === name)?.value ?? '',
    })),
    labels: labels.filter((label) => !calNameSet.has(label.name)),
  };
}

interface RehydrateCalLabelsArgs {
  calNames: string[];
  /** calLabels currently in the form. Empty right after a defaults reset has wiped them. */
  calLabels: Label[];
  /** Custom labels currently in the form. */
  labels: Label[];
  /** calLabels as written by the previous hydration, the state before any reset wiped them. */
  previousCalLabels: Label[];
  /** The check's original labels from the form defaults. */
  defaultLabels: Label[];
}

// Reconciles the CAL rows against the current form state. Hydrated rows are written with
// shouldDirty: false so the form stays pristine, which means a defaults reset (probes resolving,
// folder status arriving) wipes them back to the unpartitioned defaults — while user-edited rows
// are dirty and survive. Hence the value sources, in priority order: rows currently in the form
// (so a deliberately cleared value stays cleared), the previous hydration (edits a reset wiped),
// and finally the check's original labels.
export function rehydrateCalLabels({
  calNames,
  calLabels,
  labels,
  previousCalLabels,
  defaultLabels,
}: RehydrateCalLabelsArgs) {
  const calNameSet = new Set(calNames);
  const valueSources = [...calLabels, ...labels, ...previousCalLabels, ...defaultLabels];

  const hydratedCalLabels = calNames.map((name) => ({
    name,
    value: valueSources.find((label) => label.name === name)?.value ?? '',
  }));

  // When the tenant deconfigures a CAL (the names refetch periodically), its value moves back to
  // the custom labels rather than being silently dropped from the check on the next save.
  const previouslyManaged = [...calLabels, ...previousCalLabels];
  const deconfiguredRows = previouslyManaged.filter(
    (row, index) =>
      !calNameSet.has(row.name) &&
      row.value !== '' &&
      previouslyManaged.findIndex((candidate) => candidate.name === row.name) === index &&
      !labels.some((label) => label.name === row.name)
  );

  return {
    calLabels: hydratedCalLabels,
    labels: [...labels.filter((label) => !calNameSet.has(label.name)), ...deconfiguredRows],
  };
}
export function getBaseFormValuesFromCheck(check: Check): Omit<CheckFormValues, 'checkType' | 'settings'> {
  return {
    alertSensitivity: check.alertSensitivity,
    publishAdvancedMetrics: !check.basicMetricsOnly,
    enabled: check.enabled,
    frequency: check.frequency,
    id: check.id,
    job: check.job,
    labels: check.labels,
    calLabels: [],
    probes: check.probes,
    target: check.target,
    timeout: check.timeout,
    alerts: predefinedAlertsToFormValues(GLOBAL_PREDEFINED_ALERTS, check.alerts || []),
    channels: {
      k6: check.channels?.k6,
    },
    folderUid: check.folderUid,
  };
}

export function predefinedAlertsToFormValues(
  predefinedAlerts: PredefinedAlertInterface[],
  alerts: CheckAlertPublished[]
) {
  const defaultValues = Object.values(predefinedAlerts).reduce((acc, alert) => {
    return {
      ...acc,
      [alert.type]: alert.defaultValues,
    };
  }, {});

  const checkAlertFormValues = getCheckAlertsFormValues(alerts);

  return {
    ...defaultValues,
    ...checkAlertFormValues,
  };
}
