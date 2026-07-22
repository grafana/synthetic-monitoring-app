import React from 'react';
import { render } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardHeaderProfile } from './CheckDashboardHeader.types';

import { ObservedPerformanceSummary } from './ObservedPerformanceSummary';

const profile: CheckDashboardHeaderProfile<typeof BASIC_HTTP_CHECK> = {
  getDefinition: jest.fn(),
  getMetrics: jest.fn(() => []),
  Narrative: () => null,
};

describe('ObservedPerformanceSummary', () => {
  it('keeps panel definitions stable when the check and profile have not changed', () => {
    const { rerender } = render(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={profile} />);

    rerender(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={profile} />);

    expect(profile.getMetrics).toHaveBeenCalledTimes(1);
  });
});
