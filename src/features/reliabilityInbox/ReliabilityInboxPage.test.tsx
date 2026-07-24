import React from 'react';
import { useAssistant } from '@grafana/assistant';
import { render as renderWithoutApp, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  trackConfigurationViewed,
  trackCreateIntent,
  trackInboxExposure,
  trackRecommendationReviewed,
  trackReviewEntryClicked,
} from 'features/tracking/reliabilityInboxEvents';
import { render } from 'test/render';

import { ReliabilitySuggestion } from './types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';

import { useReliabilityInboxSuggestions } from './data';
import { toReliabilityOpportunity } from './model';
import { ReliabilityInboxBanner } from './ReliabilityInboxBanner';
import { ReliabilityInboxPage } from './ReliabilityInboxPage';

jest.mock('./data', () => ({
  useReliabilityInboxSuggestions: jest.fn(),
}));

jest.mock('features/tracking/reliabilityInboxEvents', () => ({
  trackInboxExposure: jest.fn(),
  trackReviewEntryClicked: jest.fn(),
  trackRecommendationReviewed: jest.fn(),
  trackConfigurationViewed: jest.fn(),
  trackCreateIntent: jest.fn(),
}));

const HTTP_SUGGESTION: ReliabilitySuggestion = {
  id: 'http-suggestion',
  target: 'https://mcp.goagain.dev/',
  checkType: 'http',
  evidence: {
    reqPerS: 1.6081232492997197,
    p99Ms: 4,
    statusDistribution: {
      '200': 1.6058823529411763,
      '400': 0.002240896358543417,
    },
    families: ['http_server_request_duration_seconds_bucket'],
    activitySemantics: ['bytes'],
  },
  reachability: 'public',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.4,
  dedupStatus: 'uncovered',
  authRequired: false,
  algorithms: ['score', 'exact_url_match'],
  relevance: 75,
  angles: ['customer_facing'],
  rationale: 'Public endpoint with steady traffic serving likely critical MCP protocol functions.',
  proposedCheck: {
    job: 'mcp.goagain.dev',
    frequencyMs: 60_000,
    timeoutMs: 2000,
    validStatusCodes: [200],
    failIfNotSSL: true,
    probeIds: [7],
    locationPolicy: 'Run from the suggested public probe in Frankfurt.',
  },
  prompt:
    'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [7].',
};

const OPPORTUNITIES = [toReliabilityOpportunity(HTTP_SUGGESTION)];
const openAssistant = jest.fn();

function mockSuggestions() {
  jest.mocked(useReliabilityInboxSuggestions).mockReturnValue({
    data: OPPORTUNITIES,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useReliabilityInboxSuggestions>);
}

function renderPage() {
  mockSuggestions();

  return render(<ReliabilityInboxPage />, {
    path: generateRoutePath(AppRoutes.ReliabilityInbox),
    route: getRoute(AppRoutes.ReliabilityInbox),
  });
}

describe('ReliabilityInboxPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: true,
      isLoading: false,
      openAssistant,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });
  });

  it('shows a selected public HTTP recommendation with guarded coverage wording', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Monitor mcp.goagain.dev' })).toBeInTheDocument();
    expect(screen.getByText('Highest priority')).toBeInTheDocument();
    expect(
      screen.getByText('We did not find an exact matching check among the configuration we could analyze.')
    ).toBeInTheDocument();
    expect(screen.getByText(/Hostname-only similarity is not treated as certainty/)).toBeInTheDocument();
    expect(screen.queryByText('host.docker.internal')).not.toBeInTheDocument();
    expect(openAssistant).not.toHaveBeenCalled();
    expect(trackRecommendationReviewed).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
  });

  it('requires configuration review before offering Create with Assistant', async () => {
    const { user } = renderPage();

    expect(screen.queryByRole('button', { name: 'Create with Assistant' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Review configuration' }));

    expect(screen.getByRole('heading', { name: 'Exact proposed check configuration' })).toBeInTheDocument();
    expect(screen.getByText('https://mcp.goagain.dev/')).toBeInTheDocument();
    expect(screen.getByText('Every 1 minute')).toBeInTheDocument();
    expect(screen.getByText('2 seconds')).toBeInTheDocument();
    expect(screen.getByText('Response status must be 200')).toBeInTheDocument();
    expect(screen.getByText('Run from the suggested public probe in Frankfurt.')).toBeInTheDocument();
    expect(screen.getByText('43.2k per 30-day month')).toBeInTheDocument();
    expect(openAssistant).not.toHaveBeenCalled();
    expect(trackConfigurationViewed).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
  });

  it('sends only the reviewed structured draft after explicit create intent', async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Review configuration' }));
    await user.click(screen.getByRole('button', { name: 'Create with Assistant' }));

    expect(trackCreateIntent).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'grafana-synthetic-monitoring-app/reliability-inbox',
        autoSend: true,
        prompt: expect.stringContaining('Create the reviewed HTTP Synthetic Monitoring check'),
        context: [
          expect.objectContaining({
            type: 'structured',
            title: 'Reviewed Synthetic Monitoring check draft: mcp.goagain.dev',
            data: {
              name: 'Reviewed Reliability Inbox check draft',
              task: 'create-reviewed-http-check',
              reviewedDraft: expect.objectContaining({
                target: 'https://mcp.goagain.dev/',
                checkType: 'http',
                frequencyMs: 60_000,
                timeoutMs: 2000,
                validStatusCodes: [200],
                probeIds: [7],
              }),
              assistantGuidance: expect.any(String),
            },
          }),
        ],
      })
    );
  });

  it('keeps Home compact and links to the dedicated review route', async () => {
    mockSuggestions();
    const user = userEvent.setup();
    renderWithoutApp(<ReliabilityInboxBanner />);

    expect(screen.getByText('Reliability Inbox · 1 opportunity')).toBeInTheDocument();
    expect(screen.getByText('Highest priority: mcp.goagain.dev')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Monitor mcp.goagain.dev' })).not.toBeInTheDocument();

    const reviewLink = screen.getByRole('link', { name: 'Review opportunities' });
    expect(reviewLink).toHaveAttribute('href', generateRoutePath(AppRoutes.ReliabilityInbox));
    await waitFor(() =>
      expect(trackInboxExposure).toHaveBeenCalledWith({
        opportunityCount: 1,
        topOpportunityId: 'http-suggestion',
      })
    );

    await user.click(reviewLink);
    expect(trackReviewEntryClicked).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
  });
});
