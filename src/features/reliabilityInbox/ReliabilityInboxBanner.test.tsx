import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { trackInboxExposure, trackReviewEntryClicked } from 'features/tracking/reliabilityInboxEvents';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { useCachedReliabilityInboxSuggestions } from './data';
import { toReliabilityOpportunity } from './model';
import { ReliabilityInboxBanner } from './ReliabilityInboxBanner';

jest.mock('./data', () => ({ useCachedReliabilityInboxSuggestions: jest.fn() }));
jest.mock('features/tracking/reliabilityInboxEvents', () => ({
  trackInboxExposure: jest.fn(),
  trackReviewEntryClicked: jest.fn(),
}));

const OPPORTUNITY = toReliabilityOpportunity(HTTP_RELIABILITY_SUGGESTION);

describe('ReliabilityInboxBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('links the next recommendation to the review page', async () => {
    jest.mocked(useCachedReliabilityInboxSuggestions).mockReturnValue({
      data: [OPPORTUNITY],
    } as ReturnType<typeof useCachedReliabilityInboxSuggestions>);
    const user = userEvent.setup();

    render(<ReliabilityInboxBanner />);

    expect(screen.getByText('Reliability Inbox · 1 opportunity')).toBeInTheDocument();
    expect(screen.getByText('Recommended next: mcp.goagain.dev')).toBeInTheDocument();
    const reviewLink = screen.getByRole('link', { name: 'Review suggestions' });
    expect(reviewLink).toHaveAttribute('href', generateRoutePath(AppRoutes.ReliabilityInbox));
    await waitFor(() =>
      expect(trackInboxExposure).toHaveBeenCalledWith({
        opportunityCount: 1,
        topOpportunityId: 'http-suggestion',
      })
    );

    await user.click(reviewLink);
    expect(trackReviewEntryClicked).toHaveBeenCalledWith({ opportunityId: 'http-suggestion' });
  });

  it('does not generate suggestions when the cache is empty', () => {
    jest.mocked(useCachedReliabilityInboxSuggestions).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useCachedReliabilityInboxSuggestions>);

    render(<ReliabilityInboxBanner />);

    expect(screen.getByText('Generate actionable recommendations when you are ready to review them.')).toBeInTheDocument();
    expect(screen.queryByText(/Recommended next:/)).not.toBeInTheDocument();
    expect(trackInboxExposure).not.toHaveBeenCalled();
  });
});
