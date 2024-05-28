import { useLocation as useLocationFromReactRouter } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import { Location } from 'history';

import useQueryParametersState from './useQueryParametersState';

const historyPushMock = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useHistory: jest.fn(() => ({ push: historyPushMock })),
}));

const useLocation = useLocationFromReactRouter as jest.MockedFunction<typeof useLocationFromReactRouter>;

describe('useQueryParametersState', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Gets the initial value from query params', () => {
    const initialValue = { count: 0 };
    const mockLocation: Location = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '',
      state: '',
      hash: '',
    };
    useLocation.mockReturnValue(mockLocation);
    const { result } = renderHook(() => useQueryParametersState('myKey', initialValue));

    expect(result.current[0]).toEqual({ count: 0 });
    expect(historyPushMock).toHaveBeenCalledTimes(1);
    expect(historyPushMock).toHaveBeenCalledWith({
      search: `myKey=${encodeURIComponent(JSON.stringify(initialValue))}`,
    });
  });
  test('Updates query params', () => {
    const initialValue = { count: 0 };
    const newValue = { count: 10 };

    const mockLocation: Location = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '',
      state: '',
      hash: '',
    };

    useLocation.mockReturnValue(mockLocation);

    const { result } = renderHook(() => useQueryParametersState('myKey', initialValue));
    const [, updateState] = result.current;

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      updateState(newValue);
    });

    // Check that the state has been updated to the new value
    expect(result.current[0]).toEqual(newValue);

    expect(historyPushMock).toHaveBeenCalledTimes(2);
    expect(historyPushMock).toHaveBeenLastCalledWith({
      search: `myKey=${encodeURIComponent(JSON.stringify(newValue))}`,
    });
  });

  test('Removes query params', () => {
    const initialValue = { count: 0 };
    const mockLocation: Location = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '',
      state: '',
      hash: '',
    };

    useLocation.mockReturnValue(mockLocation);

    const { result } = renderHook(() => useQueryParametersState('myKey', initialValue));
    const [, updateState] = result.current;

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      updateState(null);
    });

    expect(result.current[0]).toEqual(initialValue);

    expect(historyPushMock).toHaveBeenCalledTimes(2);
    expect(historyPushMock).toHaveBeenLastCalledWith({ search: '' });
  });

  test('Does not remove pre-existing query params when deleting a key', () => {
    const initialValue = { count: 0 };
    const mockLocation: Location = {
      search: `keyToRemove=${JSON.stringify(initialValue)}&anotherKey="anotherValue"`,
      pathname: '',
      state: '',
      hash: '',
    };

    useLocation.mockReturnValue(mockLocation);

    const { result } = renderHook(() => useQueryParametersState('keyToRemove', initialValue));
    const [, updateState] = result.current;

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      updateState(null);
    });

    expect(result.current[0]).toEqual(initialValue);

    expect(historyPushMock).toHaveBeenCalledTimes(2);
    expect(historyPushMock).toHaveBeenLastCalledWith({ search: `anotherKey=${encodeURIComponent('"anotherValue"')}` });
  });
});
