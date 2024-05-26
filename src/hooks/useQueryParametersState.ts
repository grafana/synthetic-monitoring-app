import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const useQueryParametersState = <T>(key: string, initialValue: T): [T, (value: T | null) => void] => {
  const location = useLocation();
  const history = useHistory();

  const queryParams = new URLSearchParams(location.search);
  const initialValueString = queryParams.get(key);
  const parsedInitialValue = initialValueString ? JSON.parse(initialValueString) : '';

  const [state, setState] = useState<T | null>(parsedInitialValue);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (state === null) {
      queryParams.delete(key);
    } else {
      queryParams.set(key, JSON.stringify(state));
    }
    history.replace({ search: queryParams.toString() });
  }, [key, state, location.search, history]);

  const updateState = (value: T | null) => {
    setState(value);
  };

  return [state || initialValue, updateState];
};

export default useQueryParametersState;
