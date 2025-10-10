import { CheckTypeGroup } from 'types';

import { CHECK_TYPE_GROUP_MAP } from '../../constants';
import { createCheck } from './createCheck';
import { createInstrumentedCheck } from './createInstrumentedCheck';

jest.mock('./createCheck');

const createCheckReturnValue = 'createCheckReturnValue';
// @ts-expect-error jest.fn()
createCheck.mockImplementation(() => createCheckReturnValue);

// createInstrumentedCheck is a wrapper for `createCheck`
// It's more important what arguments `createCheck` is called with
// than what `createInstrumentedCheck` returns
describe('createInstrumentedCheck({type, group})', () => {
  describe('should fallback to `DEFAULT_CHECK_TYPE`', () => {
    it.each([
      // invalid instrumentation
      [undefined, undefined],
      [1, undefined],
      [false, undefined],
      [true, undefined],
      [{ foo: true }, undefined],
      [{ foo: true }, undefined],
      [{ type: {} }, {}], // if group is set, it will be passed along to `createCheck`
      [{ group: {} }, undefined],
      // valid instrumentation
    ])('instrumentation: "%s"', (instrumentation, expected) => {
      // @ts-expect-error intentional
      expect(() => createInstrumentedCheck(instrumentation)).not.toThrow();
      // @ts-expect-error Invalid argument
      expect(createInstrumentedCheck(instrumentation)).toEqual(createCheckReturnValue);
      expect(createCheck).toHaveBeenCalledTimes(2); // once for the throw check and once for the value
      expect(createCheck).toHaveBeenCalledWith(expected);
    });
  });

  describe('should call `createCheck()` with the correct `CheckType`', () => {
    it.each([
      [{}, undefined], // technically valid
      [{ group: CheckTypeGroup.ApiTest }, CHECK_TYPE_GROUP_MAP[CheckTypeGroup.ApiTest][0]],
      [{ group: CheckTypeGroup.Scripted }, CHECK_TYPE_GROUP_MAP[CheckTypeGroup.Scripted][0]],
      [{ group: CheckTypeGroup.MultiStep }, CHECK_TYPE_GROUP_MAP[CheckTypeGroup.MultiStep][0]],
      [{ group: CheckTypeGroup.Browser }, CHECK_TYPE_GROUP_MAP[CheckTypeGroup.Browser][0]],
    ])('instrumentation: "%s"', (instrumentation, expected) => {
      const result = createInstrumentedCheck(instrumentation);
      expect(result).toEqual(createCheckReturnValue);
      // expect(result).toBe(createCheckReturnValue);
      expect(createCheck).toHaveBeenCalledTimes(1);
      expect(createCheck).toHaveBeenCalledWith(expected);
    });
  });
});
