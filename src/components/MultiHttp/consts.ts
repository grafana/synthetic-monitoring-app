import isEmpty from 'lodash';
import { CheckType, Check, AlertSensitivity, MultiHttpSettings } from 'types';
import { fallbackSettings } from 'components/constants';

export const multiHttpFallbackCheck = {
  job: '',
  target: '',
  frequency: 120000,
  timeout: 3000,
  enabled: true,
  labels: [],
  probes: [],
  alertSensitivity: AlertSensitivity.None,
  settings: {
    multihttp: fallbackSettings(CheckType.MULTI_HTTP) as MultiHttpSettings,
  },
  basicMetricsOnly: true,
} as Check;

const removeEmptyFields = (getValues) => {
  const entries = getValues().settings.multihttp;

  getValues().settings.multihttp.entries.forEach((ent) => {
    const request = ent.request;
    Object.keys(request).forEach((key) => {
      if (request[key] === '' || request[key] == null || isEmpty(request[key]) || request[key].length === 0) {
        delete request[key];
      } else if (typeof request[key] === 'object') {
        return Object.keys(request[key]).map((k, index) => {
          return Object.values(request[key][k]).forEach((i) => {
            return i.length === 0 ? delete request[key][k] : request[key][k];
          });
        });
      }
    });
    return request;
  });
  return entries;
};

export const getUpdatedCheck = (getValues) => {
  const prunedFields = removeEmptyFields(getValues);

  return {
    alertSensitivity: getValues().alertSensitivity.value,
    basicMetricsOnly: getValues().basicMetricsOnly,
    enabled: getValues().enabled,
    frequency: 120000,
    job: getValues().job,
    settings: { multihttp: prunedFields },
    labels: getValues().labels,
    probes: getValues().probes,
    target: getValues().settings.multihttp.entries[0].request.url, // TODO: FIX. Should be dynamic index
    timeout: 3000,
  } as Check;
};
