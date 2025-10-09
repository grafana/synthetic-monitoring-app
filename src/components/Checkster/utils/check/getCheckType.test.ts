import { Check, CheckType } from 'types';

import { DEFAULT_CHECK_TYPE } from '../../constants';
import { getCheckType } from './getCheckType';

describe('getCheckType(check)', () => {
  describe('should return the correct checkType', () => {
    it.each(Object.values(CheckType).map((checkType) => [checkType, { settings: { [checkType]: {} } } as Check]))(
      '%s',
      (expected, subject) => {
        expect(getCheckType(subject)).toEqual(expected);
      }
    );
  });
  describe('should return fallback checkType', () => {
    it.each([1, false, true, 0, undefined, null, {}, { settings: { unknown: {} } }])(
      '%s -> ' + DEFAULT_CHECK_TYPE,
      () => {
        expect(getCheckType(undefined)).toEqual(DEFAULT_CHECK_TYPE);
      }
    );
  });
});
