import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { SummaryDashboard } from './SummaryDashboard';

jest.mock('features/reliabilityInbox', () => {
  const React = jest.requireActual('react');

  return {
    ReliabilityInboxBanner: () => React.createElement('div', { 'data-testid': 'reliability-inbox-banner' }),
  };
});

jest.mock('hooks/useMetricsDS', () => ({
  useMetricsDS: () => undefined,
}));

describe('SummaryDashboard', () => {
  it('keeps Reliability Inbox and manual creation available when the unfiltered check inventory is empty', async () => {
    render(<SummaryDashboard checks={[]} />);

    expect(await screen.findByTestId('reliability-inbox-banner')).toBeInTheDocument();
    expect(await screen.findByText("You haven't created any checks yet")).toBeInTheDocument();
    expect(await screen.findByText('Create new check')).toBeInTheDocument();
  });
});
