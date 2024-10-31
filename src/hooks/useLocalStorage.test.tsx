import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useLocalStorage } from './useLocalStorage';

const TestComponent: React.FC = () => {
  const [value, setValue] = useLocalStorage<string>('testKey', 'initialValue');

  return (
    <div>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
      <p>Your value is: {value}</p>
    </div>
  );
};

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('should initialize with the initial value', () => {
    render(<TestComponent />);
    expect(screen.getByText((content) => content.startsWith('Your value is:'))).toHaveTextContent(
      'Your value is: initialValue'
    );
  });

  test('should update localStorage when value changes', async () => {
    render(<TestComponent />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, 'newValue');

    expect(screen.getByText((content) => content.startsWith('Your value is:'))).toHaveTextContent(
      'Your value is: newValue'
    );
    expect(window.localStorage.getItem('testKey')).toBe('"newValue"');
  });
});
