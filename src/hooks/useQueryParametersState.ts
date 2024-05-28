import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const useQueryParametersState = <ValueType>(
  key: string,
  initialValue: ValueType
): [ValueType, (value: ValueType | null) => void] => {
  const location = useLocation();
  const history = useHistory();

  const queryParams = new URLSearchParams(location.search);
  const existingValue = queryParams.get(key);
  const parsedExistingValue = existingValue ? JSON.parse(existingValue) : '';

  const [state, setState] = useState<ValueType | null>(parsedExistingValue);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (state === null) {
      queryParams.delete(key);
    } else {
      queryParams.set(key, JSON.stringify(state));
    }
    history.push({ search: queryParams.toString() });
  }, [key, state, location.search, history]);

  const updateState = (value: ValueType | null) => {
    setState(value);
  };

  return [state || initialValue, updateState];
};

export default useQueryParametersState;
