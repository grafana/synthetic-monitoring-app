import { get } from 'lodash';

import { CheckFormFieldPath, FormSectionOrder, HTTPAuthType } from '../types';
import { CheckType } from 'types';

import { DEFAULT_FORM_SECTION_ORDER, OVERRIDE_DEFAULT_SECTION_ORDER } from '../constants';

export function getFormSectionOrder(checkType?: CheckType): FormSectionOrder {
  if (checkType && OVERRIDE_DEFAULT_SECTION_ORDER[checkType]) {
    return OVERRIDE_DEFAULT_SECTION_ORDER[checkType];
  }
  return DEFAULT_FORM_SECTION_ORDER;
}

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)}/g, (_, key) => variables[key] ?? `{${key}}`);
}

export function getByPath(subject: object, ...pathSegments: Array<string | number>): unknown {
  const path = createPath(...pathSegments);
  return get(subject, path);
}

// TODO: Probably a better way to use typings here
export function createPath(...pathSegments: Array<CheckFormFieldPath | string | number>): any {
  return pathSegments.join('.');
}

export function getFieldPathError<T extends CheckFormFieldPath = CheckFormFieldPath>(
  errors: Record<string, unknown>,
  name: keyof T | string | Array<string | number>,
  variables?: Record<string, string>
) {
  const path = Array.isArray(name) ? name.join('.') : name;
  const fieldError = get(errors, path);

  const message = fieldError?.message ?? fieldError?.root?.message ?? undefined;
  if (variables && typeof message === 'string') {
    return interpolate(message, variables);
  }

  return message;
}

export function getFieldErrorProps<T extends CheckFormFieldPath = CheckFormFieldPath>(
  errors: Record<string, unknown>,
  name: keyof T | string | Array<string | number>,
  variables?: Record<string, string>
) {
  const path = Array.isArray(name) ? name.join('.') : name;
  const invalid = Boolean(get(errors, Array.isArray(name) ? name.join('.') : name));
  const error: undefined | string = getFieldPathError<T>(errors, path, variables);

  return { invalid, error };
}

export function getHttpAuthType(
  basicAuth?: { username?: string; password?: string },
  bearerToken?: string
): HTTPAuthType | undefined {
  if (basicAuth && (basicAuth.username !== undefined || basicAuth.password !== undefined)) {
    return HTTPAuthType.BasicAuth;
  }

  if (bearerToken !== undefined) {
    return HTTPAuthType.BearerToken;
  }

  return HTTPAuthType.None;
}
