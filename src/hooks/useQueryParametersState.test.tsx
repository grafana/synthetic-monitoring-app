import { useLocation as useLocationFromReactRouter } from 'react-router-dom-v5-compat';
import { act, renderHook } from '@testing-library/react';

import { useQueryParametersState } from './useQueryParametersState';

const historyPushMock = jest.fn();
const historyReplaceMock = jest.fn();
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: jest.fn(),
  useHistory: jest.fn(() => ({ replace: historyReplaceMock, push: historyPushMock })),
}));

const useLocation = useLocationFromReactRouter as jest.MockedFunction<typeof useLocationFromReactRouter>;

describe('useQueryParametersState', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Gets the initial value from query params', () => {
    const initialValue = { count: 0 };
    const mockLocation = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '',
      state: '',
      hash: '',
      key: '',
    };

    useLocation.mockReturnValue(mockLocation);
    const { result } = renderHook(() => useQueryParametersState({ key: 'myKey', initialValue }));

    expect(result.current[0]).toEqual({ count: 0 });
    expect(historyReplaceMock).toHaveBeenCalledTimes(0);
  });

  test('Updates query params', () => {
    const initialValue = { count: 0 };
    const newValue = { count: 10 };

    const mockLocation = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '',
      state: '',
      hash: '',
      key: '',
    };

    useLocation.mockReturnValue(mockLocation);

    const { result } = renderHook(() => useQueryParametersState({ key: 'myKey', initialValue }));
    const [state, updateState] = result.current;

    expect(state).toEqual(initialValue);

    act(() => {
      updateState(newValue);
    });

    expect(historyReplaceMock).toHaveBeenCalledTimes(1);
    expect(historyReplaceMock).toHaveBeenCalledWith(`/?myKey=${encodeURIComponent(JSON.stringify(newValue))}`);
  });

  test('Removes query params', () => {
    const initialValue = { count: 0 };
    const mockLocation = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '',
      state: '',
      hash: '',
      key: '',
    };

    useLocation.mockReturnValue(mockLocation);

    const { result } = renderHook(() => useQueryParametersState({ key: 'myKey', initialValue }));
    const [, updateState] = result.current;

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      updateState(null);
    });

    expect(result.current[0]).toEqual(initialValue);

    expect(historyReplaceMock).toHaveBeenCalledTimes(1);
    expect(historyReplaceMock).toHaveBeenCalledWith('/');
  });

  test('Does not remove pre-existing query params when deleting a key', () => {
    const initialValue = { count: 0 };
    const initialValueNotToBeRemoved = 'anotherValue';
    const mockLocation = {
      search: `keyToRemove=${JSON.stringify(initialValue)}&anotherKey="${initialValueNotToBeRemoved}"`,
      pathname: '',
      state: '',
      hash: '',
      key: '',
    };

    useLocation.mockReturnValue(mockLocation);

    const { result } = renderHook(() => useQueryParametersState({ key: 'keyToRemove', initialValue }));
    const [, updateState] = result.current;

    expect(result.current[0]).toEqual(initialValue);

    act(() => {
      updateState(null);
    });

    expect(result.current[0]).toEqual(initialValue);

    expect(historyReplaceMock).toHaveBeenCalledTimes(1);
    const { result: anotherKeyState } = renderHook(() =>
      useQueryParametersState({ key: 'anotherKey', initialValue: '' })
    );
    expect(anotherKeyState.current[0]).toEqual(initialValueNotToBeRemoved);
  });
});
