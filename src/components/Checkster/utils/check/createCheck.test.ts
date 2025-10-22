import { CheckType } from 'types';

import { DEFAULT_CHECK_CONFIG, DEFAULT_CHECK_CONFIG_MAP } from '../../constants';
import { getDefaultCheckConfig } from './getDefaultCheckConfig';

describe('createCheck(checkType)', () => {
  describe('should return the correct check from `DEFAULT_CHECK_CONFIG_MAP`', () => {
    it.each(
      Object.values(CheckType).map((checkType) => {
        return [checkType, DEFAULT_CHECK_CONFIG_MAP[checkType]];
      })
    )('checkType: %s', (checkType, expected) => {
      expect(getDefaultCheckConfig(checkType)).toBe(expected);
    });
  });

  it('should return return `DEFAULT_CHECK_CONFIG` for invalid/missing checkType', () => {
    expect(getDefaultCheckConfig()).toBe(DEFAULT_CHECK_CONFIG);
    // @ts-expect-error Intentionally invalid type
    expect(getDefaultCheckConfig('__invalid_checkType')).toBe(DEFAULT_CHECK_CONFIG);
  });
});
