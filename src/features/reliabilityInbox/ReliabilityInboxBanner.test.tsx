import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { trackInboxExposure, trackReviewEntryClicked } from 'features/tracking/reliabilityInboxEvents';
import { SM_DATASOURCE } from 'test/fixtures/datasources';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { reliabilityInboxQueryKey } from './data';
import { ReliabilityInboxBanner } from './ReliabilityInboxBanner';

jest.mock('features/tracking/reliabilityInboxEvents', () => ({
  trackInboxExposure: jest.fn(),
  trackReviewEntryClicked: jest.fn(),
}));

const QUERY_KEY = reliabilityInboxQueryKey(SM_DATASOURCE.jsonData.apiHost, SM_DATASOURCE.jsonData.metrics.hostedId);

describe('ReliabilityInboxBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('summarizes cached suggestions and links to the review page', async () => {
    const { queryClient, user } = render(<ReliabilityInboxBanner />);

    expect(await screen.findByRole('heading', { name: 'Check Suggestions' })).toBeInTheDocument();

    act(() => queryClient.setQueryData(QUERY_KEY, [HTTP_RELIABILITY_SUGGESTION]));

    expect(
      await screen.findByText('1 suggestion is ready to review · turn traffic signals into proactive monitoring')
    ).toBeInTheDocument();
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

  it('does not generate suggestions when the cache is empty', async () => {
    const request = jest.fn(() => ({ json: { suggestions: [], warnings: [] } }));
    server.use(apiRoute('reliabilityInboxSuggestions', { result: request }));

    render(<ReliabilityInboxBanner />);

    expect(await screen.findByRole('heading', { name: 'Check Suggestions' })).toBeInTheDocument();
    expect(
      screen.getByText('Generate actionable recommendations when you are ready to review them.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Generate suggestions' })).toHaveAttribute(
      'href',
      generateRoutePath(AppRoutes.ReliabilityInbox)
    );
    expect(screen.queryByText(/turn traffic signals into proactive monitoring/)).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
    expect(trackInboxExposure).not.toHaveBeenCalled();
  });
});
