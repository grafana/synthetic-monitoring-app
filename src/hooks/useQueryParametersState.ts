import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router';
import { locationService } from '@grafana/runtime';

import { useURLSearchParams } from 'hooks/useURLSearchParams';

enum HistoryStrategy {
  Push = 'push',
  Replace = 'replace',
}

interface QueryParametersStateProps<ValueType> {
  key: string;
  initialValue: ValueType;
  encode?: (value: ValueType) => string;
  decode?: (value: string) => ValueType;
  strategy?: HistoryStrategy;
}

export const useQueryParametersState = <ValueType>({
  key,
  initialValue,
  encode = JSON.stringify,
  decode = JSON.parse,
  strategy = HistoryStrategy.Replace,
}: QueryParametersStateProps<ValueType>): [ValueType, (value: ValueType | null) => void] => {
  const location = useLocation();
  const urlSearchParams = useURLSearchParams();

  const existingValue = urlSearchParams.get(key);

  const parsedExistingValue = useMemo(() => {
    return existingValue ? decode(existingValue) : null;
  }, [existingValue, decode]);

  const updateState = (value: ValueType | null) => {
    const newParams = new URLSearchParams(location.search);
    if (value === null) {
      newParams.delete(key);
    } else {
      newParams.set(key, encode(value));
    }
    const search = newParams.toString();
    const href = search.length > 0 ? `${location.pathname}?${search}` : location.pathname;

    updateHistory(href);
  };

  const updateHistory = useCallback(
    (href: string) => {
      switch (strategy) {
        case HistoryStrategy.Push:
          locationService.push(href);
          break;
        case HistoryStrategy.Replace:
          locationService.replace(href);
          break;
        default:
          locationService.push(href);
          break;
      }
    },
    [strategy]
  );

  return [parsedExistingValue || initialValue, updateState];
};
