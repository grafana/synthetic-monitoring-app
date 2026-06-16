import React, { PropsWithChildren } from 'react';
import { OpenFeatureTestProvider } from '@openfeature/react-sdk';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';
import { getTestFlagValues } from 'test/openFeatureTestProvider';

import { ProbeStateStatus } from './types.adhoc-check';

import { LogsPanel } from './LogsPanel';

// required by useFeatureFlag
const wrapper = ({ children }: PropsWithChildren) => (
  <OpenFeatureTestProvider domain={SM_OPEN_FEATURE_DOMAIN} flagValueMap={getTestFlagValues()}>
    {children}
  </OpenFeatureTestProvider>
);

jest.mock('scenes/components/LogsRenderer/screenshots/screenshots.hooks', () => ({
  useScreenshots: jest.fn().mockReturnValue(new Map()),
}));

function buildLog({ msg, time, statusCode }: { msg: string; time: string; statusCode: string }) {
  return {
    level: 'info',
    msg,
    time,
    status_code: statusCode,
  };
}

describe('adhoc-check', () => {
  describe('LogsPanel', () => {
    it('keeps an expanded log open when polling adds a new entry', async () => {
      const user = userEvent.setup();
      const initialLogs = [
        buildLog({ msg: 'first log', time: '2024-01-01T00:00:01Z', statusCode: '101' }),
        buildLog({ msg: 'second log', time: '2024-01-01T00:00:02Z', statusCode: '202' }),
      ];

      const { rerender } = render(
        <LogsPanel
          logs={initialLogs}
          probe="test probe"
          state={ProbeStateStatus.Success}
          timeseries={[]}
          from={0}
          to={0}
        />,
        { wrapper }
      );

      await user.click(screen.getByText('test probe'));
      await user.click(screen.getByText('second log'));

      expect(screen.getByTestId('preformatted')).toHaveTextContent('status_code: 202');

      rerender(
        <LogsPanel
          logs={[buildLog({ msg: 'new log', time: '2024-01-01T00:00:00Z', statusCode: '000' }), ...initialLogs]}
          probe="test probe"
          state={ProbeStateStatus.Success}
          timeseries={[]}
          from={0}
          to={0}
        />
      );

      expect(screen.getByTestId('preformatted')).toHaveTextContent('status_code: 202');
    });
  });
});
