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
    if (value === null) {
      queryParams.delete(key);
    } else {
      queryParams.set(key, encode(value));
    }

    updateHistory();
  };

  const updateHistory = useCallback(() => {
    switch (strategy) {
      case HistoryStrategy.Push:
        history.push({ search: queryParams.toString() });
        break;
      case HistoryStrategy.Replace:
        history.replace({ search: queryParams.toString() });
        break;
      default:
        history.push({ search: queryParams.toString() });
        break;
    }
  }, [strategy, history, queryParams]);

  return [parsedExistingValue || initialValue, updateState];
};

export default useQueryParametersState;
