import { CheckInfo } from 'datasource/types';
import { createContext } from 'react';

interface UsageContextValue {
  loading: boolean;
  checkInfo?: CheckInfo;
}

export const CheckInfoContext = createContext<UsageContextValue>({
  loading: true,
});
