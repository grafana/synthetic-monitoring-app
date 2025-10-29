// import { CheckType } from 'types';
//
// import { CHECK_TYPE_OPTION_MAP, DEFAULT_CHECK_TYPE } from '../../constants';
//
// export function getCheckTypeOption(checkType?: CheckType) {
//   return CHECK_TYPE_OPTION_MAP[checkType ?? DEFAULT_CHECK_TYPE] ?? CHECK_TYPE_OPTION_MAP[DEFAULT_CHECK_TYPE];
// }

import { CheckType } from 'types';

import { CHECK_TYPE_OPTION_MAP, DEFAULT_CHECK_TYPE } from '../../constants';
import { getCheckTypeOption } from './getCheckTypeOption';

describe('getCheckType(checkType)', () => {
  describe('should return correct check type options', () => {
    it.each(Object.values(CheckType).map((checkType) => [checkType, CHECK_TYPE_OPTION_MAP[checkType]]))(
      'checkType: "%s"',
      (checkType, expected) => {
        expect(getCheckTypeOption(checkType)).toEqual(expected);
      }
    );
  });

  describe('should return fallback for invalid check type', () => {
    const fallback = CHECK_TYPE_OPTION_MAP[DEFAULT_CHECK_TYPE];
    it.each([true, false, undefined, 'hello', {}, null])('checkType: "%s"', (checkType) => {
      // @ts-expect-error Intentional
      expect(getCheckTypeOption(checkType)).toEqual(fallback);
    });
  });
});
