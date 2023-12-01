import { createContext } from 'react';

import { Check } from 'types';

interface ChecksContextValue {
  checks: Check[];
  loading: boolean;
  refetchChecks: () => void;
}
export const ChecksContext = createContext<ChecksContextValue>({
  checks: [],
  loading: true,
  refetchChecks: () => {},
});
