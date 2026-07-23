import React, { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';

import { resolveCheckHealth } from './checkHealth';
import { CheckHealthProvider, useCheckHealth, useCheckHealthOptional } from './CheckHealthContext';

const model = resolveCheckHealth({
  metricIds: ['uptime'],
  evidence: [],
  rangeMode: 'live',
  evaluationAt: 1,
});

describe('CheckHealthContext', () => {
  it('provides a resolved health model', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <CheckHealthProvider value={model}>{children}</CheckHealthProvider>
    );

    const { result } = renderHook(() => useCheckHealth(), { wrapper });

    expect(result.current).toBe(model);
  });

  it('offers an optional read for profiles without health support', () => {
    const { result } = renderHook(() => useCheckHealthOptional());

    expect(result.current).toBeNull();
  });

  it('fails clearly when a required read is outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    try {
      expect(() => renderHook(() => useCheckHealth())).toThrow(
        'useCheckHealth must be used inside a CheckHealthProvider'
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
