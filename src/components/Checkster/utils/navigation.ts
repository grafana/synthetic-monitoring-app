import { ENTRY_INDEX_CHAR } from '../constants';

export function normalizeFlattenedErrors(errors: string[]) {
  return errors.map((error) => {
    if (error.startsWith(`settings.multihttp.entries`)) {
      return error.replace(/\.[0-9]\./, `.${ENTRY_INDEX_CHAR}.`);
    }

    return error;
  });
}
