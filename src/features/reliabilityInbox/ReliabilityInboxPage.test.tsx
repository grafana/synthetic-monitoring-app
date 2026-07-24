import React from 'react';
import { useAssistant } from '@grafana/assistant';
import { config } from '@grafana/runtime';
import { render as renderWithoutApp, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  trackInboxExposure,
  trackRecommendationReviewed,
  trackReviewEntryClicked,
  trackSetupWithAssistant,
} from 'features/tracking/reliabilityInboxEvents';
import { render } from 'test/render';

import { ReliabilitySuggestion } from './types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';

import { useReliabilityInboxSuggestions } from './data';
import { toReliabilityOpportunity } from './model';
import { ReliabilityInboxBanner } from './ReliabilityInboxBanner';
import { RELIABILITY_INBOX_PAGE_NAV, ReliabilityInboxPage } from './ReliabilityInboxPage';

jest.mock('./data', () => ({
  useReliabilityInboxSuggestions: jest.fn(),
}));

jest.mock('@grafana/scenes-react', () => {
  const actual = jest.requireActual('@grafana/scenes-react');
  const React = jest.requireActual('react');

  return {
    ...actual,
    VizPanel: () => React.createElement('div', { 'data-testid': 'reliability-evidence-viz-panel' }),
  };
});

jest.mock('features/tracking/reliabilityInboxEvents', () => ({
  trackInboxExposure: jest.fn(),
  trackReviewEntryClicked: jest.fn(),
  trackRecommendationReviewed: jest.fn(),
  trackSetupWithAssistant: jest.fn(),
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
  evidencePrototype: {
    kind: 'graft-demo-v1',
    window: {
      label: 'the last 24 hours',
      from: 1_784_800_800_000,
      to: 1_784_887_200_000,
    },
    exactRequestTotal: 14_700,
    timeline: [
      { timestamp: 1_784_800_800_000, requests: 5100 },
      { timestamp: 1_784_804_400_000, requests: 4900 },
      { timestamp: 1_784_808_000_000, requests: 4700 },
    ],
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

const openAssistant = jest.fn();

function mockSuggestions(suggestion = HTTP_SUGGESTION) {
  jest.mocked(useReliabilityInboxSuggestions).mockReturnValue({
    data: [toReliabilityOpportunity(suggestion)],
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
    config.bootData.user.orgId = 1;
    jest.mocked(useAssistant).mockReturnValue({
      isAvailable: true,
      isLoading: false,
      openAssistant,
      closeAssistant: jest.fn(),
      toggleAssistant: jest.fn(),
    });
  });

  it('leads with a decision-oriented recommendation and neutral coverage status', async () => {
    const { user } = renderPage();

    expect(await screen.findByRole('heading', { name: 'Add an HTTP check for mcp.goagain.dev' })).toBeInTheDocument();
    expect(screen.getByText('Recommended next step')).toBeInTheDocument();
    expect(screen.getByText('Highest priority')).toBeInTheDocument();

    const endpoint = screen.getByLabelText('Recommended endpoint');
    expect(within(endpoint).getByText('GET')).toBeInTheDocument();
    expect(within(endpoint).getByText('mcp.goagain.dev')).toBeInTheDocument();
    expect(within(endpoint).queryByText('https://mcp.goagain.dev/')).not.toBeInTheDocument();

    const queueSubject = within(screen.getByLabelText('Review queue')).getByText('mcp.goagain.dev');
    expect(queueSubject).toHaveAttribute('title', 'https://mcp.goagain.dev/');

    const queueSignals = screen.getByLabelText('Decision signals for mcp.goagain.dev');
    expect(within(queueSignals).getByText('High value')).toBeInTheDocument();
    expect(within(queueSignals).getByText('High confidence')).toBeInTheDocument();

    const recommendationSignals = screen.getByLabelText('Recommendation signals');
    expect(within(recommendationSignals).getByText('High value')).toBeInTheDocument();
    expect(within(recommendationSignals).getByText('High confidence')).toBeInTheDocument();

    expect(
      screen.getByText(
        'Synthetic Monitoring does not appear to monitor this traffic yet, so we recommend adding this check.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Demo evidence')).toBeInTheDocument();
    expect(screen.getByText('14,700')).toBeInTheDocument();
    expect(screen.getByText('requests · the last 24 hours')).toBeInTheDocument();
    expect(screen.getByLabelText('Observed requests over time')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View in Explore' })).not.toBeInTheDocument();

    const coverageDisclosure = screen.getByText('How we checked').closest('details');
    expect(coverageDisclosure).not.toHaveAttribute('open');
    await user.click(screen.getByText('How we checked'));
    expect(coverageDisclosure).toHaveAttribute('open');
    expect(screen.getByText(/Similar or indirect monitoring may still exist/)).toBeVisible();

    expect(screen.queryByText('host.docker.internal')).not.toBeInTheDocument();
    expect(openAssistant).not.toHaveBeenCalled();
    expect(trackRecommendationReviewed).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
  });

  it('shows an honest no-data state when prototype trend samples are empty', async () => {
    mockSuggestions({
      ...HTTP_SUGGESTION,
      evidencePrototype: {
        ...HTTP_SUGGESTION.evidencePrototype!,
        timeline: [],
      },
    });

    render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'No traffic trend is available for this evidence window.'
    );
    expect(screen.queryByLabelText('Observed requests over time')).not.toBeInTheDocument();
  });

  it('keeps the existing page-level loading state while evidence is loading', async () => {
    jest.mocked(useReliabilityInboxSuggestions).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useReliabilityInboxSuggestions>);

    render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    expect(await screen.findByText('Loading Reliability Inbox…')).toBeInTheDocument();
    expect(screen.queryByText('Evidence at a glance')).not.toBeInTheDocument();
  });

  it('anchors breadcrumbs and back navigation to the Synthetics home', () => {
    expect(RELIABILITY_INBOX_PAGE_NAV).toEqual({
      text: 'Reliability Inbox',
      parentItem: {
        text: 'Synthetics',
        url: generateRoutePath(AppRoutes.Home),
      },
    });
  });

  it('shows a compact proposed check with configuration details on demand', async () => {
    const { user } = renderPage();

    expect(await screen.findByRole('heading', { name: 'GET mcp.goagain.dev' })).toBeInTheDocument();
    expect(screen.getByText('HTTP GET · Every 1 minute')).toBeInTheDocument();
    expect(screen.getAllByText('Run from the suggested public probe in Frankfurt.')[0]).toBeVisible();

    const configurationDisclosure = screen.getByText('View configuration details').closest('details');
    expect(configurationDisclosure).not.toHaveAttribute('open');
    expect(screen.getByText('https://mcp.goagain.dev/')).not.toBeVisible();
    await user.click(screen.getByText('View configuration details'));
    expect(configurationDisclosure).toHaveAttribute('open');
    expect(screen.getByText('https://mcp.goagain.dev/')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Copy target URL' })).toBeVisible();
    expect(screen.getByText('2 seconds')).toBeVisible();
    expect(screen.getByText('Require HTTPS')).toBeVisible();

    expect(screen.getByRole('button', { name: 'Review and customize check' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review and customize check' })).toHaveAttribute(
      'aria-describedby',
      'reliability-inbox-assistant-action-help'
    );
    expect(
      screen.getByText(
        'Assistant will guide setup and recommend a configuration from this proposal. Nothing is created or saved until you confirm.'
      )
    ).toBeInTheDocument();
    expect(openAssistant).not.toHaveBeenCalled();
  });

  it('hands structured evidence and draft to Assistant as bounded setup guidance', async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Review and customize check' }));

    expect(trackSetupWithAssistant).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'grafana-synthetic-monitoring-app/reliability-inbox',
        autoSend: true,
        prompt: expect.stringMatching(
          /inspect the real available probes and existing checks.*Ask only for inputs that materially change.*Do not invent credentials.*show all changes in one compact final configuration.*Do not create or save the check until I explicitly confirm/i
        ),
        context: [
          expect.objectContaining({
            type: 'structured',
            title: 'Reliability Inbox setup: mcp.goagain.dev',
            data: expect.objectContaining({
              name: 'Reliability Inbox guided setup',
              task: 'guide-suggested-http-check-setup',
              evidence: expect.objectContaining({
                target: 'https://mcp.goagain.dev/',
                requestsPerSecond: 1.6081232492997197,
                measurementWindow: 'last hour',
                coverageMatch: expect.objectContaining({
                  compared: ['observed target', 'URL path', 'HTTP check type'],
                }),
              }),
              suggestedDraft: expect.objectContaining({
                target: 'https://mcp.goagain.dev/',
                checkType: 'http',
                frequencyMs: 60_000,
                timeoutMs: 2000,
                validStatusCodes: [200],
                probeIds: [7],
              }),
              setupContract: {
                beginFromSuggestedDraft: true,
                inspectWhereToolsPermit: ['real available probes', 'existing Synthetic Monitoring checks'],
                askOnlyWhenMateriallyChanging: [
                  'cadence',
                  'timeout',
                  'regions or probes',
                  'response assertion',
                  'alerting intent',
                ],
                neverInvent: [
                  'credentials',
                  'private-network details',
                  'DNS resolvers',
                  'probe assignments',
                  'business semantics',
                ],
                finalReview: 'Show every proposed change in one compact final configuration.',
                creationPolicy:
                  'Do not create or save the check until the user explicitly confirms the final configuration.',
              },
              assistantGuidance: expect.any(String),
            }),
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
    expect(screen.queryByText('Assistant-guided review')).not.toBeInTheDocument();
    expect(screen.getByText('Highest priority: mcp.goagain.dev')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Add an HTTP check for mcp.goagain.dev' })).not.toBeInTheDocument();

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
