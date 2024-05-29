import { useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { useSearchParams } from './useSearchParams';

enum HistoryStrategy {
  Push = 'push',
  Replace = 'replace',
}

const useQueryParametersState = <ValueType>(
  key: string,
  initialValue: ValueType,
  strategy: HistoryStrategy = HistoryStrategy.Push
): [ValueType, (value: ValueType | null) => void] => {
  const history = useHistory();

  const queryParams = useSearchParams();

  const existingValue = queryParams.get(key);

  //@todo: implement a better way to parse the value
  let parsedExistingValue = useMemo(() => {
    return existingValue ? JSON.parse(existingValue) : '';
  }, [existingValue]);

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

  const updateState = (value: ValueType | null) => {
    if (value === null) {
      queryParams.delete(key);
    } else {
      queryParams.set(key, JSON.stringify(value));
    }

    updateHistory();
  };

  return [parsedExistingValue || initialValue, updateState];
};

export default useQueryParametersState;
