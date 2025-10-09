import { CheckInstrumentation } from '../../types';
import { Check } from 'types';

import { CHECK_TYPE_GROUP_MAP } from '../../constants';
import { createCheck } from './createCheck';

export function createInstrumentedCheck(instrumentation: CheckInstrumentation): Check {
  try {
    const { type, group } = instrumentation;
    if (type) {
      return createCheck(type);
    }

    // Fallback to default check type for the group or default to DEFAULT_CHECK_TYPE
    const [defaultType] = group && CHECK_TYPE_GROUP_MAP[group] ? CHECK_TYPE_GROUP_MAP[group] : [undefined];

    return createCheck(defaultType);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('createInstrumentedCheck failed, using fallback', error);
    }
    return createCheck(undefined); // relevant for testing
  }
}
