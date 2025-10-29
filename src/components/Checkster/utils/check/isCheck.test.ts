import { CheckType } from 'types';

import { isCheck } from './isCheck';

describe('isCheck(check)', () => {
  describe('should not throw on invalid check param', () => {
    it.each([
      undefined,
      null,
      1,
      'hello, world!',
      { foo: true },
      Number(),
      String(),
      () => {
        throw new Error('Should not be called');
      },
      NaN,
      // URLSearchParams, // Works, but produces a lot of bloat in console when converted to string (%s)
    ])('subject: "%s"', (subject) => {
      expect(() => isCheck(subject)).not.toThrow();
    });
  });

  describe('should return true for "checks" based on "settings" keys', () => {
    it.each(Object.values(CheckType))('checkType: %s', (checkType) => {
      const subject = { settings: { [checkType]: {} } };
      expect(isCheck(subject)).toBe(true);
    });
  });
});
