import { interpolate } from '../../utils/form';

export function createFieldListRegExps(fieldList: string[][], index: number) {
  return fieldList.map((entry) => {
    return entry.map((template) => {
      return new RegExp(interpolate(template, { index }));
    });
  });
}
