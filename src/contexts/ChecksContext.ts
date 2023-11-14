import { createContext } from 'react';

import { Check } from 'types';

interface ChecksContextValue {
  checks: Check[];
  scriptedChecks: Check[];
  loading: boolean;
  refetchChecks: () => void;
}
export const ChecksContext = createContext<ChecksContextValue>({
  scriptedChecks: [],
  checks: [],
  loading: true,
  refetchChecks: () => {},
});
