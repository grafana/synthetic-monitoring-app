import isEmpty from 'lodash';
import { UseFormGetValues, FieldValues } from 'react-hook-form';
import { CheckType, Check, AlertSensitivity, MultiHttpSettings } from 'types';
import { MultiHttpEntry, KeyTypes } from 'components/MultiHttp/MultiHttpTypes';
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

const removeEmptyFields = (getValues: any) => {
  const entries = getValues().settings.multihttp;
  getValues().settings.multihttp.entries.forEach((ent: MultiHttpEntry) => {
    const request = ent.request;

    // @ts-ignore
    Object.keys(request).forEach((key: KeyTypes) => {
      if (request[key] === '' || request[key] == null || isEmpty(request[key]) || request[key].length === 0) {
        delete request[key];
      } else if (typeof request[key] === 'object') {
        // @ts-ignore
        return Object.keys(request[key]).map((k) => {
          // @ts-ignore
          return Object.values(request[key][k]).forEach((i: any) => {
            // @ts-ignore
            return i.length === 0 ? delete request[key][k] : request[requestKey][k];
          });
        });
      }

      return;
    });
    return request;
  });
  return entries;
};

export const getUpdatedCheck = (getValues: UseFormGetValues<FieldValues>) => {
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
