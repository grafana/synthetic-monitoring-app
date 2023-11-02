import { createContext } from 'react';

import { CheckInfo } from 'datasource/types';

interface UsageContextValue {
  loading: boolean;
  checkInfo?: CheckInfo;
}

export const CheckInfoContext = createContext<UsageContextValue>({
  loading: true,
});
