import { FieldValues } from 'react-hook-form';
import { get, isPlainObject } from 'lodash';
import { ZodType } from 'zod';

import { CheckFormFieldPath, FormSectionOrder, HTTPAuthType } from '../types';
import { CheckType } from 'types';

import { DEFAULT_FORM_SECTION_ORDER, OVERRIDE_DEFAULT_SECTION_ORDER } from '../constants';

export function getFormSectionOrder(checkType?: CheckType): FormSectionOrder {
  if (checkType && OVERRIDE_DEFAULT_SECTION_ORDER[checkType]) {
    return OVERRIDE_DEFAULT_SECTION_ORDER[checkType];
  }
  return DEFAULT_FORM_SECTION_ORDER;
}

export function interpolate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{(\w+)}/g, (_, key) => String(variables[key] ?? `{${key}}`));
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
  variables?: Record<string, string>,
  relevantErrors?: string[]
) {
  const path = Array.isArray(name) ? name.join('.') : name;

  if (relevantErrors) {
    if (relevantErrors.length === 0 || !relevantErrors.includes(path as string)) {
      return {
        invalid: false,
        error: undefined,
      };
    }
  }

  const invalid = Boolean(get(errors, path));
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

export function checkFormFieldPath(path: string, checkType?: CheckType) {
  if (path[0] === '.') {
    const [_root, ...rest] = path;
    return rest.join('');
  }

  if (path.startsWith('settings.')) {
    return path;
  }

  if (!checkType) {
    throw new Error('CheckType is required for short syntax (except for root paths)');
  }

  return `settings.${checkType}.${path}` as const;
}

export function getAllErrorFields<T extends FieldValues>(schema: ZodType<T>, values: T) {
  const result = schema.safeParse(values);
  if (result.success) {
    return [];
  }

  return result.error.issues.reduce<string[]>((acc, issue) => {
    acc.push(issue.path.join('.'));

    return acc;
  }, []);
}

export function isNotErrorObject(subject: unknown): subject is Record<string, unknown> {
  if (!subject || (!Array.isArray(subject) && !isPlainObject(subject))) {
    return false;
  }

  const keys = Object.keys(subject);
  return !keys.every((key) => ['ref', 'type', 'message'].includes(key));
}

function hasNestedRecord(subject: unknown): subject is IterableValue {
  return !!subject && (isPlainObject(subject) || Array.isArray(subject));
}

type DeepRecord<T> = Record<string, Record<string, T | unknown>> | ArrayLike<T>;

interface HasNestedEntriesCallback {
  (subject: unknown): subject is IterableValue;
}

type IterableValue = Record<string, unknown> | ArrayLike<unknown>;

export function flattenObjectKeys<T>(
  subject: Record<string, T> | DeepRecord<T>,
  hasNestedRecordCallback: HasNestedEntriesCallback = hasNestedRecord
) {
  return Object.entries(subject).reduce<string[]>((acc, [key, value]) => {
    if (hasNestedRecordCallback(value)) {
      acc.push(...flattenObjectKeys(value, hasNestedRecordCallback).map((subKey) => `${key}.${subKey}`));
    } else {
      acc.push(key);
    }

    return acc;
  }, []);
}

// Note: validation errors
export function getFlattenErrors(errors: IterableValue | undefined) {
  if (errors === undefined) {
    return [];
  }
  return flattenObjectKeys(errors, isNotErrorObject);
}

export function isFocusingError(errors: string[]) {
  const activeElement = document.activeElement;
  return activeElement && 'name' in activeElement && errors.includes(activeElement.name as string);
}

export function onErrorFocusFallback(errors: string[]) {
  const targetElement = document.querySelectorAll(errors.map((error) => `[data-form-name='${error}']`).join(', '))[0];
  if (targetElement && targetElement instanceof HTMLElement) {
    targetElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    if (targetElement.dataset.formElementSelector) {
      const formElement = targetElement.querySelectorAll(targetElement.dataset.formElementSelector)[0];
      if (formElement instanceof HTMLElement) {
        formElement.focus();
      }
    } else {
      const childElements = targetElement.querySelectorAll(`[data-form-name='${targetElement.dataset.formName}']`);
      if (childElements.length > 0) {
        const lastElement = childElements[childElements.length - 1];
        if (lastElement instanceof HTMLElement) {
          lastElement.focus();
        }
      } else {
        targetElement.focus();
      }
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('Form error has occurred without proper handling of scroll/focus.');
  }
}
