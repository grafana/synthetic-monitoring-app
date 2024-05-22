import {
  CheckFormValuesMultiHttp,
  HttpMethod,
  MultiHttpAssertionType,
  MultiHTTPCheck,
  MultiHttpSettings,
  MultiHttpSettingsFormValues,
} from 'types';
import { toBase64 } from 'utils';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/toPayload.utils';
import { FALLBACK_CHECK_MULTIHTTP } from 'components/constants';
import { MultiHttpRequestBody } from 'components/MultiHttp/MultiHttpTypes';

export function getMultiHTTPPayload(formValues: CheckFormValuesMultiHttp): MultiHTTPCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    target: formValues?.settings?.multihttp?.entries[0]?.request.url,
    settings: {
      multihttp: getMultiHttpSettings(formValues?.settings?.multihttp),
    },
  };
}

const getMultiHttpSettings = (settings?: MultiHttpSettingsFormValues): MultiHttpSettings => {
  if (!settings) {
    return FALLBACK_CHECK_MULTIHTTP.settings.multihttp;
  }

  return {
    entries: settings.entries?.map((entry, index) => {
      const includeBody =
        entry.request.body?.contentEncoding || entry.request.body?.contentType || entry.request.body?.payload;
      const body = includeBody
        ? ({ ...entry.request.body, payload: toBase64(entry.request.body?.payload ?? '') } as MultiHttpRequestBody)
        : undefined;

      return {
        ...entry,
        request: {
          ...entry.request,
          body,
          method: entry.request.method ?? HttpMethod.GET,
        },
        variables:
          entry.variables?.map((variable) => {
            if (variable.type === undefined) {
              throw new Error('Selecting a variable type is required');
            }
            return {
              ...variable,
              type: variable.type,
            };
          }) ?? [],
        checks:
          entry.checks?.map(({ type, subject, condition, value, expression }) => {
            switch (type) {
              case MultiHttpAssertionType.Text:
                if (subject === undefined || condition === undefined) {
                  throw new Error('Cannot have a Text assertion without a subject and condition');
                }
                return {
                  type: type,
                  subject: subject,
                  condition: condition,
                  value,
                };
              case MultiHttpAssertionType.JSONPath:
                return {
                  type: type,
                  expression,
                };
              case MultiHttpAssertionType.JSONPathValue:
                if (condition === undefined) {
                  throw new Error('Cannot have a JSON path value assertion without a condition');
                }
                return {
                  type: type,
                  condition: condition,
                  expression,
                  value,
                };
              case MultiHttpAssertionType.Regex:
                if (subject === undefined) {
                  throw new Error('Cannot have a Regex assertion without a subject');
                }
                return {
                  type: type,
                  subject: subject,
                  expression,
                };
              default:
                throw new Error('invalid assertion type');
            }
          }) ?? [],
      };
    }),
  };
};
