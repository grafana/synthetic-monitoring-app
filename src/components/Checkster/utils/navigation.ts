import { FormFieldMatch } from '../types';

import { ENTRY_INDEX_CHAR } from '../constants';

export function normalizeFlattenedErrors(errors: string[]) {
  return errors.map((error) => {
    if (error.startsWith(`settings.multihttp.entries`)) {
      return error.replace(/\.[0-9]\./, `.${ENTRY_INDEX_CHAR}.`);
    }

    return error;
  });
}

export function getHasSectionError(sectionFields: FormFieldMatch[], errors: string[]) {
  const testErrors = errors.join('|');
  return sectionFields.some((field) => {
    if (!field) {
      return false;
    }

    if (field instanceof RegExp) {
      return field.test(testErrors);
    }

    return errors.some((path) => {
      return field.startsWith(path);
    });
  });
}
