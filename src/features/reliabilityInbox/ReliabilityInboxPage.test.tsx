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

const openAssistant = jest.fn();

function mockSuggestions(suggestion = HTTP_SUGGESTION) {
  const result = {
    data: [toReliabilityOpportunity(suggestion)],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useReliabilityInboxSuggestions>;

  jest.mocked(useReliabilityInboxSuggestions).mockReturnValue(result);
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

  it('leads with an actionable recommendation and the evidence behind it', async () => {
    const { user } = renderPage();

    expect(await screen.findByRole('heading', { name: 'Add an HTTP check for mcp.goagain.dev' })).toBeInTheDocument();
    expect(screen.getByText('Recommended next step')).toBeInTheDocument();

    const endpoint = screen.getByLabelText('Recommended endpoint');
    expect(within(endpoint).getByText('GET')).toBeInTheDocument();
    expect(within(endpoint).getByText('mcp.goagain.dev')).toBeInTheDocument();
    expect(within(endpoint).queryByText('https://mcp.goagain.dev/')).not.toBeInTheDocument();

    const queueSubject = within(screen.getByLabelText('Review queue')).getByText('mcp.goagain.dev');
    expect(queueSubject).toHaveAttribute('title', 'https://mcp.goagain.dev/');

    const queue = screen.getByLabelText('Review queue');
    expect(within(queue).getByText('Recommended next')).toBeInTheDocument();
    expect(within(queue).getByText('No matching check found')).toBeInTheDocument();
    expect(within(queue).getByText('Public HTTP · 1.6 req/s')).toBeInTheDocument();

    expect(
      screen.getByText(
        'We observed 5.8k requests in the last hour, and no matching Synthetic Monitoring check was found.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No matching check found' })).toBeInTheDocument();
    expect(screen.queryByText('High value')).not.toBeInTheDocument();
    expect(screen.queryByText('High confidence')).not.toBeInTheDocument();
    expect(screen.queryByText('Ready to review')).not.toBeInTheDocument();
    expect(screen.getByText('5.8k')).toBeInTheDocument();
    expect(screen.getByText('estimated requests in the last hour')).toBeInTheDocument();
    expect(screen.getByText('5xx responses')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Investigate in Explore' })).toHaveAttribute(
      'href',
      expect.stringContaining('/explore?')
    );

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

  it('does not render missing aggregate evidence as zero', async () => {
    mockSuggestions({
      ...HTTP_SUGGESTION,
      evidence: {
        statusDistribution: {},
        families: HTTP_SUGGESTION.evidence.families,
      },
    });

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
    expect(screen.queryByRole('link', { name: 'Investigate in Explore' })).not.toBeInTheDocument();
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

  it('shows a compact proposed check with configuration details on demand', async () => {
    const { user } = renderPage();

    expect(await screen.findByRole('heading', { name: 'GET mcp.goagain.dev' })).toBeInTheDocument();
    expect(screen.getByText('HTTP GET · Every 1 minute')).toBeInTheDocument();
    expect(screen.getAllByText('Run from the configured public probe with ID 7.')[0]).toBeVisible();

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
});
