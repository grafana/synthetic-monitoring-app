import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { Check, CheckAlertType } from 'types';
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

const mockLocationHref = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    get href() {
      return '';
    },
    set href(value: string) {
      mockLocationHref(value);
    },
  },
  writable: true,
});

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
    jest.useFakeTimers();
    mockLocationHref.mockClear();

    mockUseChecks.mockReturnValue({
      data: [BASIC_HTTP_CHECK],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useChecks>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Runbook redirects', () => {
    test('redirects to runbook URL for ProbeFailedExecutionsTooHigh alert', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const searchParams = createMockSearchParams({
        'var-job': BASIC_HTTP_CHECK.job,
        'var-instance': BASIC_HTTP_CHECK.target,
        'var-alert': 'ProbeFailedExecutionsTooHigh',
        'var-runbook': 'true',
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const takeNowButton = screen.getByText('Take me there now');
      await user.click(takeNowButton);

      expect(mockLocationHref).toHaveBeenCalledWith('https://example.com/runbooks/probe-failures');
    });

    test('redirects to runbook URL for TLSTargetCertificateCloseToExpiring alert', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const searchParams = createMockSearchParams({
        'var-job': BASIC_HTTP_CHECK.job,
        'var-instance': BASIC_HTTP_CHECK.target,
        'var-alert': 'TLSTargetCertificateCloseToExpiring',
        'var-runbook': 'true',
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const takeNowButton = screen.getByText('Take me there now');
      await user.click(takeNowButton);

      expect(mockLocationHref).toHaveBeenCalledWith('https://example.com/runbooks/tls-certificate');
    });

    test('parses alert names with brackets correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const searchParams = createMockSearchParams({
        'var-job': BASIC_HTTP_CHECK.job,
        'var-instance': BASIC_HTTP_CHECK.target,
        'var-alert': 'ProbeFailedExecutionsTooHigh [5m]',
        'var-runbook': 'true',
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const takeNowButton = screen.getByText('Take me there now');
      await user.click(takeNowButton);

      expect(mockLocationHref).toHaveBeenCalledWith('https://example.com/runbooks/probe-failures');
    });

    test('navigates to fallback when runbook URL is not configured', () => {
      const checkWithoutRunbook: Check = {
        ...BASIC_HTTP_CHECK,
        alerts: [
          {
            name: CheckAlertType.ProbeFailedExecutionsTooHigh,
            threshold: 5,
            period: '5m',
            created: Date.now(),
            modified: Date.now(),
            status: 'active',
            // No runbookUrl
          },
        ],
      };

      mockUseChecks.mockReturnValue({
        data: [checkWithoutRunbook],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useChecks>);

      const searchParams = createMockSearchParams({
        'var-job': checkWithoutRunbook.job,
        'var-instance': checkWithoutRunbook.target,
        'var-alert': 'ProbeFailedExecutionsTooHigh',
        'var-runbook': 'true',
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/mocked/path?runbookMissing=ProbeFailedExecutionsTooHigh');
      expect(mockLocationHref).not.toHaveBeenCalled();
    });

    test('navigates to fallback when alert type is unknown', () => {
      const searchParams = createMockSearchParams({
        'var-job': BASIC_HTTP_CHECK.job,
        'var-instance': BASIC_HTTP_CHECK.target,
        'var-alert': 'UnknownAlertType',
        'var-runbook': 'true',
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/mocked/path');
      expect(mockLocationHref).not.toHaveBeenCalled();
    });

    test('ignores alert parameter when runbook flag is not set', () => {
      const searchParams = createMockSearchParams({
        'var-job': BASIC_HTTP_CHECK.job,
        'var-instance': BASIC_HTTP_CHECK.target,
        'var-alert': 'ProbeFailedExecutionsTooHigh',
        // No var-runbook=true
      });
      mockUseURLSearchParams.mockReturnValue(searchParams);

      render(<SceneRedirecter />);

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/mocked/path');
      expect(mockLocationHref).not.toHaveBeenCalled();
    });
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
