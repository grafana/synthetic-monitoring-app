import { FormFieldMatch } from '../types';

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
      return path.startsWith(field);
    });
  });
}
