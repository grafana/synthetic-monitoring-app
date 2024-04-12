import { CheckFormValuesMultiHttp, CheckType, MultiHTTPCheck, MultiHttpSettingsFormValues } from 'types';
import { fromBase64 } from 'utils';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';
import {
  ASSERTION_CONDITION_OPTIONS,
  ASSERTION_SUBJECT_OPTIONS,
  FALLBACK_CHECK_MULTIHTTP,
  MULTI_HTTP_ASSERTION_TYPE_OPTIONS,
  MULTI_HTTP_VARIABLE_TYPE_OPTIONS,
} from 'components/constants';

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
              type:
                MULTI_HTTP_VARIABLE_TYPE_OPTIONS.find(({ value }) => value === type) ??
                MULTI_HTTP_VARIABLE_TYPE_OPTIONS[0],
              name,
              expression,
              attribute,
            };
          }) ?? [],
        checks:
          entry.checks?.map(({ type, subject, condition, expression, value }) => {
            return {
              type:
                MULTI_HTTP_ASSERTION_TYPE_OPTIONS.find(({ value }) => value === type) ??
                MULTI_HTTP_ASSERTION_TYPE_OPTIONS[0],
              subject: ASSERTION_SUBJECT_OPTIONS.find(({ value }) => value === subject),
              condition: ASSERTION_CONDITION_OPTIONS.find(({ value }) => value === condition),
              expression,
              value,
            };
          }) ?? [],
      };
    }),
  };
};
