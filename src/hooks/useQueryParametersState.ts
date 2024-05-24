import { useEffect, useState } from 'react';
import { useHistory,useLocation } from 'react-router-dom';

const useQueryParametersState = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
    const location = useLocation();
    const history = useHistory();

    const queryParams = new URLSearchParams(location.search);
    const initialValueString = queryParams.get(key);
    const parsedInitialValue = initialValueString ? JSON.parse(initialValueString) : initialValue;

    const [state, setState] = useState<T>(parsedInitialValue);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set(key, JSON.stringify(state));
        history.replace({ search: queryParams.toString() });
    }, [key, state, location.search, history]);

    const updateState = (value: T) => {
        setState(value);
    };

    return [state, updateState];
};

export default useQueryParametersState;
