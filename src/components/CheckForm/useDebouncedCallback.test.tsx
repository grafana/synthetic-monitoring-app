import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { useDebouncedCallback } from './useDebouncedCallback';

jest.useFakeTimers();

function TestComponent({ callback, delay = 300 }: { callback: (...args: any[]) => void; delay?: number }) {
  const debounced = useDebouncedCallback(callback, delay);
  return (
    <button onClick={() => debounced('test')}>Click</button>
  );
}

describe('useDebouncedCallback', () => {
  it('calls the callback after the delay', () => {
    const cb = jest.fn();
    render(<TestComponent callback={cb} delay={500} />);
    act(() => {
      screen.getByText('Click').click();
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(cb).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(cb).toHaveBeenCalledWith('test');
  });

  it('only calls the last callback if called multiple times rapidly', () => {
    const cb = jest.fn();
    render(<TestComponent callback={cb} delay={300} />);
    act(() => {
      screen.getByText('Click').click();
      screen.getByText('Click').click();
      screen.getByText('Click').click();
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('test');
  });

  it('does not call the callback if unmounted before delay', () => {
    const cb = jest.fn();
    const { unmount } = render(<TestComponent callback={cb} delay={300} />);
    act(() => {
      screen.getByText('Click').click();
    });
    unmount();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(cb).not.toHaveBeenCalled();
  });
}); 
