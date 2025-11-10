import React from 'react';
import { render, screen } from '@testing-library/react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { LogMessage } from './LogMessage';

describe('adhoc-check', () => {
  describe('LogMessage', () => {
    it('should render `check` correctly (success)', () => {
      const logWithCheck = {
        level: 'info',
        msg: 'the message',
        time: '0',
        check: 'my assertion',
        value: 1,
      };
      render(<LogMessage log={logWithCheck} logLevel="info" />);
      expect(screen.getByText(logWithCheck.check, { exact: false })).toBeInTheDocument();
      expect(screen.getByTestId(CHECKSTER_TEST_ID.feature.adhocCheck.LogMessage.checkIcon)).toHaveAttribute(
        'name',
        'check'
      );
    });

    it('should render `check` correctly (fail)', () => {
      const logWithCheck = {
        level: 'info',
        msg: 'the message',
        time: '0',
        check: 'my assertion',
        value: 0,
      };
      render(<LogMessage log={logWithCheck} logLevel="info" />);
      expect(screen.getByText(logWithCheck.check, { exact: false })).toBeInTheDocument();
      expect(screen.getByTestId(CHECKSTER_TEST_ID.feature.adhocCheck.LogMessage.checkIcon)).toHaveAttribute(
        'name',
        'times'
      );
    });
  });
});
