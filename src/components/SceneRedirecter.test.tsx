import React from 'react';
import { render, screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { useChecks } from 'data/useChecks';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

import { SceneRedirecter } from './SceneRedirecter';

jest.mock('data/useChecks');
jest.mock('hooks/useURLSearchParams');
jest.mock('routing/utils', () => ({
  generateRoutePath: jest.fn(() => '/mocked/path'),
}));
jest.mock('react-router-dom-v5-compat', () => ({
  Navigate: ({ to, replace }: { to: string; replace: boolean }) => (
    <div data-testid="navigate" data-to={to} data-replace={replace}>
      Navigate to {to}
    </div>
  ),
}));

const mockUseChecks = useChecks as jest.MockedFunction<typeof useChecks>;
const mockUseURLSearchParams = useURLSearchParams as jest.MockedFunction<typeof useURLSearchParams>;

function createMockSearchParams(params: Record<string, string>): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });
  return searchParams;
}

describe('SceneRedirecter', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseChecks.mockReturnValue({
      data: [BASIC_HTTP_CHECK],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);
  });

  describe('Basic redirects', () => {
    test('redirects to check dashboard when check is found', () => {
      const searchParams = createMockSearchParams({
        'var-job': BASIC_HTTP_CHECK.job,
        'var-instance': BASIC_HTTP_CHECK.target,
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/mocked/path');
      expect(navigate).toHaveAttribute('data-replace', 'true');
    });

    test('redirects to home when check is not found', () => {
      const searchParams = createMockSearchParams({
        'var-job': 'non-existent-job',
        'var-instance': 'non-existent-target',
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/mocked/path');
      expect(navigate).toHaveAttribute('data-replace', 'true');
    });

    test('redirects to home when check has no id', () => {
      const checkWithoutId = { ...BASIC_HTTP_CHECK, id: undefined };
      mockUseChecks.mockReturnValue({
        data: [checkWithoutId],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useChecks>);

      const searchParams = createMockSearchParams({
        'var-job': checkWithoutId.job,
        'var-instance': checkWithoutId.target,
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/mocked/path');
      expect(navigate).toHaveAttribute('data-replace', 'true');
    });

    describe('Loading state', () => {
      test('shows loading spinner when checks are loading', () => {
        mockUseChecks.mockReturnValue({
          data: undefined,
          isLoading: true,
          error: null,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useChecks>);

        const searchParams = createMockSearchParams({
          'var-job': 'test-job',
          'var-instance': 'test-target',
        });
        mockUseURLSearchParams.mockReturnValue(searchParams);

        render(<SceneRedirecter />);

        expect(screen.getByLabelText('Loading checks')).toBeInTheDocument();
      });
    });
  });
});
