import { FieldErrors, FieldPath } from 'react-hook-form';
import { ZodType } from 'zod';

import { CheckFormValues } from 'types';
import { PROBES_SELECT_ID } from 'components/CheckEditor/CheckProbes';

export function checkForErrors({
  fields = [],
  values,
  schema,
}: {
  values: CheckFormValues;
  fields: Array<FieldPath<CheckFormValues>>;
  schema: ZodType<CheckFormValues>;
}) {
  const result = schema.safeParse(values);

  if (!result.success) {
    const errors = result.error.errors.reduce<string[]>((acc, err) => {
      const path = err.path.join('.');
      const isRelevant = fields.some((f) => path.startsWith(f));

      if (isRelevant) {
        return [...acc, path];
      }

      return acc;
    }, []);
    return {
      errors,
    };
  }

  return {
    errors: [],
  };
}

export function findFieldToFocus(errs: FieldErrors<CheckFormValues>): HTMLElement | undefined {
  if (shouldFocusProbes(errs)) {
    return document.querySelector<HTMLInputElement>(`#${PROBES_SELECT_ID} input`) || undefined;
  }

  const ref = findRef(errs);
  const isVisible = ref?.offsetParent !== null;
  return isVisible ? ref : undefined;
}

function findRef(target: any): HTMLElement | undefined {
  if (Array.isArray(target)) {
    let ref;
    for (let i = 0; i < target.length; i++) {
      const found = findRef(target[i]);

      if (found) {
        ref = found;
        break;
      }
    }

    return ref;
  }

  if (target !== null && typeof target === `object`) {
    if (target.ref) {
      return target.ref;
    }

    return findRef(Object.values(target));
  }

  return undefined;
}

function shouldFocusProbes(errs: FieldErrors<CheckFormValues>) {
  if (errs?.job || errs?.target) {
    return false;
  }

  return `probes` in errs;
}
