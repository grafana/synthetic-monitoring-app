import { useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { useSearchParams } from './useSearchParams';

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

const useQueryParametersState = <ValueType>({
  key,
  initialValue,
  encode = JSON.stringify,
  decode = JSON.parse,
  strategy = HistoryStrategy.Push,
}: QueryParametersStateProps<ValueType>): [ValueType, (value: ValueType | null) => void] => {
  const history = useHistory();

  const queryParams = useSearchParams();

  const existingValue = queryParams.get(key);

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
    const href = search.length > 0 ? `${location.pathname}?${newParams.toString()}` : location.pathname;

    updateHistory(href);
  };

  const updateHistory = useCallback(
    (href: string) => {
      switch (strategy) {
        case HistoryStrategy.Push:
          history.push(href);
          break;
        case HistoryStrategy.Replace:
          history.replace(href);
          break;
        default:
          history.push(href);
          break;
      }
    },
    [strategy, history]
  );

  return [parsedExistingValue || initialValue, updateState];
};

export default useQueryParametersState;
