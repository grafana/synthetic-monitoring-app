import React from 'react';
import { useAssistant } from '@grafana/assistant';
import { screen, within } from '@testing-library/react';
import { trackRecommendationReviewed, trackSetupWithAssistant } from 'features/tracking/reliabilityInboxEvents';
import { render } from 'test/render';

import { ReliabilitySuggestion } from './types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';

import { useReliabilityInboxSuggestions } from './data';
import { toReliabilityOpportunity } from './model';
import { ReliabilityInboxPage } from './ReliabilityInboxPage';

jest.mock('./data', () => ({
  useReliabilityInboxSuggestions: jest.fn(),
}));

jest.mock('features/tracking/reliabilityInboxEvents', () => ({
  trackRecommendationReviewed: jest.fn(),
  trackSetupWithAssistant: jest.fn(),
}));

const HTTP_SUGGESTION: ReliabilitySuggestion = {
  id: 'http-suggestion',
  target: 'https://mcp.goagain.dev/',
  checkType: 'http',
  evidence: {
    reqPerS: 1.6081232492997197,
    errorRatio: 0.0014,
    p99Ms: 4,
    statusDistribution: {
      '200': 1.6058823529411763,
      '400': 0.002240896358543417,
    },
    families: ['http_server_request_duration_seconds_bucket'],
    provenance: {
      datasource: 'prometheus-uid',
      range: { from: '1784800800000', to: '1784804400000' },
      queries: [{ expr: 'sum(rate(http_server_request_duration_seconds_count[1h]))' }],
    },
  },
  reachability: 'public',
  reachabilitySource: 'service_dns_hint',
  confidence: 'high',
  score: 1.4,
  dedupStatus: 'uncovered',
  authRequired: false,
  relevance: 75,
  rationale: 'Public endpoint with steady traffic serving likely critical MCP protocol functions.',
  prompt:
    'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [7].',
};

const LOWER_PRIORITY_HTTP_SUGGESTION: ReliabilitySuggestion = {
  ...HTTP_SUGGESTION,
  id: 'lower-priority-http-suggestion',
  target: 'https://secondary.goagain.dev/',
  relevance: 20,
  evidence: {
    ...HTTP_SUGGESTION.evidence,
    reqPerS: 0.5,
  },
};

const openAssistant = jest.fn();

function mockSuggestions(suggestions: ReliabilitySuggestion[] = [HTTP_SUGGESTION]) {
  const result = {
    data: suggestions.map(toReliabilityOpportunity),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useReliabilityInboxSuggestions>;

  jest.mocked(useReliabilityInboxSuggestions).mockReturnValue(result);
}

function renderPage(suggestions?: ReliabilitySuggestion[]) {
  mockSuggestions(suggestions);

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

  it('separates the suggested check from the evidence behind it', async () => {
    const { user } = renderPage();

    await screen.findByRole('heading', { name: 'Create an HTTP check' });

    const suggestedCheck = screen.getByRole('region', { name: 'Create an HTTP check' });
    const evidence = screen.getByRole('region', { name: 'Why this recommendation' });
    expect(within(suggestedCheck).getByText('Suggested check')).toBeInTheDocument();
    expect(within(evidence).getByRole('heading', { name: 'Observed traffic evidence' })).toBeInTheDocument();
    expect(within(suggestedCheck).getByLabelText('Suggested check endpoint')).toHaveTextContent(
      'MethodGETTargetmcp.goagain.dev'
    );
    expect(within(evidence).getByRole('link', { name: 'Explore telemetry' })).toHaveAttribute(
      'href',
      expect.stringContaining('/explore?')
    );

    await user.click(within(evidence).getByText('How we checked'));
    expect(
      within(evidence).getByText(
        'We compared the endpoint and path with accessible HTTP checks. Aliases, redirects, upstream checks, and checks for other paths may not match directly.'
      )
    ).toBeVisible();
    expect(trackRecommendationReviewed).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
  });

  it('updates the detail pane when a different recommendation is selected', async () => {
    const { user } = renderPage([HTTP_SUGGESTION, LOWER_PRIORITY_HTTP_SUGGESTION]);

    await screen.findByRole('heading', { name: 'Create an HTTP check' });

    const queue = screen.getByLabelText('Recommendations');
    const queueItems = within(queue).getAllByRole('button');
    await user.click(queueItems[1]);

    expect(queueItems[0]).toHaveAttribute('aria-pressed', 'false');
    expect(queueItems[1]).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(screen.getByLabelText('Suggested check endpoint')).getByText('secondary.goagain.dev')
    ).toBeInTheDocument();
    expect(trackRecommendationReviewed).toHaveBeenCalledWith({
      opportunityId: 'lower-priority-http-suggestion',
      checkType: 'http',
    });
  });

  it('does not render missing aggregate evidence as zero', async () => {
    mockSuggestions([
      {
        ...HTTP_SUGGESTION,
        evidence: {
          statusDistribution: {},
          families: HTTP_SUGGESTION.evidence.families,
        },
      },
    ]);

    render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'No aggregate traffic values were returned for this suggestion.'
    );
    expect(screen.queryByText('0 req/s')).not.toBeInTheDocument();
    expect(screen.queryByText('0 ms')).not.toBeInTheDocument();
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Explore telemetry' })).not.toBeInTheDocument();
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
    expect(screen.queryByText('Why this recommendation')).not.toBeInTheDocument();
  });

  it('shows a compact proposed check with configuration details on demand', async () => {
    const { user } = renderPage();

    const suggestedCheck = await screen.findByRole('region', { name: 'Create an HTTP check' });
    expect(within(suggestedCheck).getByText('Public HTTP')).toBeInTheDocument();
    expect(within(suggestedCheck).getByText('Every 1 minute')).toBeInTheDocument();
    expect(within(suggestedCheck).getAllByText('Require HTTPS')[0]).toBeInTheDocument();
    expect(within(suggestedCheck).getByText('Run from the configured public probe with ID 7.')).not.toBeVisible();

    const configurationDisclosure = within(suggestedCheck).getByText('View configuration details').closest('details');
    expect(configurationDisclosure).not.toHaveAttribute('open');
    expect(within(suggestedCheck).getByText('https://mcp.goagain.dev/')).not.toBeVisible();
    await user.click(within(suggestedCheck).getByText('View configuration details'));
    expect(configurationDisclosure).toHaveAttribute('open');
    expect(within(suggestedCheck).getByText('https://mcp.goagain.dev/')).toBeVisible();
    expect(within(suggestedCheck).getByRole('button', { name: 'Copy target URL' })).toBeVisible();
    expect(within(suggestedCheck).getByText('2 seconds')).toBeVisible();
    expect(within(configurationDisclosure!).getByText('Require HTTPS')).toBeVisible();
    expect(within(configurationDisclosure!).getByText('Run from the configured public probe with ID 7.')).toBeVisible();

    expect(within(suggestedCheck).getByRole('button', { name: 'Review and customize' })).toBeInTheDocument();
    expect(within(suggestedCheck).getByRole('button', { name: 'Review and customize' })).toHaveAttribute(
      'aria-describedby',
      'reliability-inbox-assistant-action-help'
    );
    expect(
      within(suggestedCheck).getByText(
        'Assistant will guide setup and recommend a configuration from this proposal. Nothing is created or saved until you confirm.'
      )
    ).toBeInTheDocument();
    expect(openAssistant).not.toHaveBeenCalled();
  });

  it('hands structured evidence and draft to Assistant as bounded setup guidance', async () => {
    const { user } = renderPage();

    await user.click(await screen.findByRole('button', { name: 'Review and customize' }));

    expect(trackSetupWithAssistant).toHaveBeenCalledWith({
      opportunityId: 'http-suggestion',
      checkType: 'http',
    });
    expect(openAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'grafana-synthetic-monitoring-app/reliability-inbox',
        autoSend: true,
        prompt: expect.stringMatching(/Do not create or save the check until I explicitly confirm/i),
        context: [
          expect.objectContaining({
            type: 'structured',
            title: 'Reliability Inbox setup: mcp.goagain.dev',
            data: expect.objectContaining({
              name: 'Reliability Inbox guided setup',
              suggestion: HTTP_SUGGESTION,
              suggestedDraft: expect.objectContaining({
                target: 'https://mcp.goagain.dev/',
                checkType: 'http',
                frequencyMs: 60_000,
                timeoutMs: 2000,
                validStatusCodes: [200],
                probeIds: [7],
              }),
            }),
          }),
        ],
      })
    );
  });

  it('defers probe location selection to the review flow', async () => {
    mockSuggestions([
      {
        ...HTTP_SUGGESTION,
        prompt:
          'Create a Grafana Synthetic Monitoring http check for https://mcp.goagain.dev/. Suggested configuration: job "mcp.goagain.dev", frequency 1m0s, timeout 2s, expect HTTP status [200], fail if not SSL, probe IDs [].',
      },
    ]);

    const { user } = render(<ReliabilityInboxPage />, {
      path: generateRoutePath(AppRoutes.ReliabilityInbox),
      route: getRoute(AppRoutes.ReliabilityInbox),
    });

    const suggestedCheck = await screen.findByRole('region', { name: 'Create an HTTP check' });
    expect(within(suggestedCheck).queryByText('Probe selection required')).not.toBeInTheDocument();
    await user.click(within(suggestedCheck).getByText('View configuration details'));
    expect(within(suggestedCheck).getByText('Probe locations will be selected during review.')).toBeVisible();
  });
});
