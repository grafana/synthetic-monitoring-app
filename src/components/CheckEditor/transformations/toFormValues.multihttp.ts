import { CheckFormValuesMultiHttp, CheckType, MultiHTTPCheck, MultiHttpSettingsFormValues } from 'types';
import { fromBase64 } from 'utils';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';
import { FALLBACK_CHECK_MULTIHTTP } from 'components/constants';

export function getMultiHTTPCheckFormValues(check: MultiHTTPCheck): CheckFormValuesMultiHttp {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.MULTI_HTTP,
    settings: {
      multihttp: getMultiHttpFormValues(check.settings),
    },
  };
}

const getMultiHttpFormValues = (settings: MultiHTTPCheck['settings']): MultiHttpSettingsFormValues => {
  const multiHttpSettings = settings.multihttp ?? FALLBACK_CHECK_MULTIHTTP.settings.multihttp;

  return {
    entries: multiHttpSettings.entries?.map((entry) => {
      return {
        request: {
          ...entry.request,
          body: entry.request.body
            ? {
                ...entry.request.body,
                payload: fromBase64(entry.request.body?.payload ?? ''),
              }
            : undefined,
        },
        variables:
          entry.variables?.map(({ type, name, expression, attribute }) => {
            return {
              type,
              name,
              expression,
              attribute,
            };
          }) ?? [],
        checks:
          entry.checks?.map(({ type, subject, condition, expression, value }) => {
            return {
              type,
              subject,
              condition,
              expression,
              value,
            };
          }) ?? [],
      };
    }),
  };
};
