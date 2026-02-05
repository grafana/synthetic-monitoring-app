import { useLocation as useLocationFromReactRouter } from 'react-router';
import { locationService } from '@grafana/runtime';
import { act, renderHook } from '@testing-library/react';

import { useQueryParametersState } from './useQueryParametersState';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
}));

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  locationService: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

const useLocation = useLocationFromReactRouter as jest.MockedFunction<typeof useLocationFromReactRouter>;
const mockLocationService = locationService as jest.Mocked<typeof locationService>;

describe('useQueryParametersState', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Gets the initial value from query params', () => {
    const initialValue = { count: 0 };
    const mockLocation = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '/',
      state: '',
      hash: '',
      key: '',
    };

    useLocation.mockReturnValue(mockLocation);
    const { result } = renderHook(() => useQueryParametersState({ key: 'myKey', initialValue }));

    expect(result.current[0]).toEqual({ count: 0 });
    expect(mockLocationService.replace).toHaveBeenCalledTimes(0);
  });

  test('Updates query params', () => {
    const initialValue = { count: 0 };
    const newValue = { count: 10 };

    const mockLocation = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '/',
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

    expect(mockLocationService.replace).toHaveBeenCalledTimes(1);
    expect(mockLocationService.replace).toHaveBeenCalledWith(`/?myKey=${encodeURIComponent(JSON.stringify(newValue))}`);
  });

  test('Removes query params', () => {
    const initialValue = { count: 0 };
    const mockLocation = {
      search: `myKey=${JSON.stringify(initialValue)}`,
      pathname: '/',
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

    expect(mockLocationService.replace).toHaveBeenCalledTimes(1);
    expect(mockLocationService.replace).toHaveBeenCalledWith('/');
  });

  test('Does not remove pre-existing query params when deleting a key', () => {
    const initialValue = { count: 0 };
    const initialValueNotToBeRemoved = 'anotherValue';
    const mockLocation = {
      search: `keyToRemove=${JSON.stringify(initialValue)}&anotherKey="${initialValueNotToBeRemoved}"`,
      pathname: '/',
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

    expect(mockLocationService.replace).toHaveBeenCalledTimes(1);
    const { result: anotherKeyState } = renderHook(() =>
      useQueryParametersState({ key: 'anotherKey', initialValue: '' })
    );
    expect(anotherKeyState.current[0]).toEqual(initialValueNotToBeRemoved);
  });
});
