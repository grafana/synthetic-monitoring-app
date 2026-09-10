import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';
import { DB } from 'test/db';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { AlertSensitivity, Check, CheckAlertDraft, CheckAlertType, CheckType, FeatureName } from 'types';

import { DISMISSED_FINDINGS_STORAGE_KEY } from './Recommendations.constants';
import { RecommendationsTab } from './RecommendationsTab';

const ONE_MINUTE = 60 * 1000;
const DAY_IN_SECONDS = 24 * 60 * 60;

function buildCheck(overrides: Partial<Check>, type = CheckType.Http): Check {
  return DB.check.build(
    {
      alertSensitivity: AlertSensitivity.None,
      alerts: [],
      enabled: true,
      labels: [],
      frequency: ONE_MINUTE,
      ...overrides,
    },
    { transient: { type } }
  );
}

function renderTab(checks: Check[]) {
  server.use(apiRoute('listChecks', { result: () => ({ json: checks }) }));

  return render(<RecommendationsTab />);
}

function mockReportInteraction() {
  const reportInteraction = jest.fn();
  jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;

  return reportInteraction;
}

async function findSection(name: RegExp) {
  const heading = await screen.findByRole('heading', { name });

  return heading.closest(`[data-testid="${RECOMMENDATIONS_TEST_ID.section}"]`) as HTMLElement;
}

describe('Recommendations tab', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('alerting gaps', () => {
    it('reports checks that are running without alerting and links to them', async () => {
      await renderTab([
        buildCheck({ job: 'unalerted', target: 'https://a.com' }),
        buildCheck({ job: 'alerted', target: 'https://b.com', alertSensitivity: AlertSensitivity.High }),
      ]);

      const section = await findSection(/alerting/i);

      expect(within(section).getByText('1 of 2 checks have no alerts')).toBeInTheDocument();
      expect(within(section).getByText('unalerted')).toBeInTheDocument();
      expect(within(section).queryByText('alerted')).not.toBeInTheDocument();
      expect(within(section).getByRole('link', { name: /view in check list/i })).toHaveAttribute(
        'href',
        expect.stringContaining('alerts=without&status=enabled')
      );
    });

    it('links each affected check to its editor', async () => {
      const check = buildCheck({ job: 'unalerted', target: 'https://a.com', id: 42 });

      await renderTab([check]);

      const section = await findSection(/alerting/i);

      expect(within(section).getByRole('link', { name: 'Edit unalerted' })).toHaveAttribute(
        'href',
        expect.stringContaining('/checks/42/edit')
      );
    });

    it('previews the default alerts for the check type before adding them', async () => {
      const { user } = await renderTab([buildCheck({ job: 'unalerted', target: 'https://a.com' })]);
      const section = await findSection(/alerting/i);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for unalerted' }));

      expect(within(section).getByText('Probe Failed Executions Too High')).toBeInTheDocument();
      expect(within(section).getByText('1 over 5 min')).toBeInTheDocument();
      expect(within(section).getByText('HTTP Request Duration Too High Avg')).toBeInTheDocument();
      expect(within(section).getByText('300ms over 5 min')).toBeInTheDocument();
      expect(within(section).getByText('HTTP Target Certificate Close To Expiring')).toBeInTheDocument();
      expect(within(section).getByText('30d')).toBeInTheDocument();
    });

    it('adds the default alerts to one check and drops it from the finding', async () => {
      const reportInteraction = mockReportInteraction();
      const check = buildCheck({ job: 'unalerted', target: 'https://a.com', id: 7 });
      const other = buildCheck({ job: 'also-unalerted', target: 'https://b.com', id: 8 });
      let savedAlerts: CheckAlertDraft[] = [];

      server.use(
        apiRoute('updateAlertsForCheck', {
          result: async (req) => {
            savedAlerts = ((await req.json()) as { alerts: CheckAlertDraft[] }).alerts;

            return { json: null };
          },
        }),
        // Once alerts are saved, the list reflects them, which is what removes the row.
        apiRoute('listChecks', {
          result: () => ({
            json: savedAlerts.length
              ? [
                  {
                    ...check,
                    alerts: savedAlerts.map((alert) => ({ ...alert, created: 1, modified: 1, status: 'OK' })),
                  },
                  other,
                ]
              : [check, other],
          }),
        })
      );

      const { user } = render(<RecommendationsTab />);
      const section = await findSection(/alerting/i);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for unalerted' }));
      await user.click(within(section).getByRole('button', { name: 'Add 3 alerts' }));

      expect(savedAlerts.map((alert) => alert.name)).toEqual([
        CheckAlertType.ProbeFailedExecutionsTooHigh,
        CheckAlertType.TLSTargetCertificateCloseToExpiring,
        CheckAlertType.HTTPRequestDurationTooHighAvg,
      ]);
      await waitFor(() => expect(within(section).queryByText('unalerted')).not.toBeInTheDocument());
      expect(within(section).getByText('also-unalerted')).toBeInTheDocument();
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({ finding: 'alerting-gaps', action: 'alerts_added', checkCount: 1, scope: 'check' })
      );
    });

    it('adds the default alerts to every unalerted check after confirming', async () => {
      const reportInteraction = mockReportInteraction();
      const updatedCheckIds: string[] = [];

      server.use(
        apiRoute('updateAlertsForCheck', {
          result: (req) => {
            updatedCheckIds.push(new URL(req.url).pathname.split('/').at(-2)!);

            return { json: null };
          },
        })
      );

      const { user } = await renderTab([
        buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
        buildCheck({ job: 'two', target: 'https://b.com', id: 2 }, CheckType.Scripted),
      ]);
      const section = await findSection(/alerting/i);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for all 2 checks' }));

      const dialog = await screen.findByRole('dialog');
      // Three for the HTTP check and the failed-executions alert for the scripted one.
      expect(within(dialog).getByText(/adds 4 alerts across 2 checks/i)).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Add alerts' }));

      await waitFor(() => expect(updatedCheckIds.sort()).toEqual(['1', '2']));
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({ finding: 'alerting-gaps', action: 'alerts_added', checkCount: 2, scope: 'finding' })
      );
    });

    it('keeps the row and reports the failure when the alerts cannot be saved', async () => {
      server.use(apiRoute('updateAlertsForCheck', { result: () => ({ status: 500, json: { err: 'nope' } }) }));

      const { user } = await renderTab([buildCheck({ job: 'unalerted', target: 'https://a.com' })]);
      const section = await findSection(/alerting/i);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for unalerted' }));
      await user.click(within(section).getByRole('button', { name: 'Add 3 alerts' }));

      await waitFor(() => expect(within(section).getByRole('button', { name: 'Add 3 alerts' })).toBeEnabled());
      expect(within(section).queryByText(/alerts added/i)).not.toBeInTheDocument();
    });

    it('stretches the evaluation period to fit a check that runs less often', async () => {
      const { user } = await renderTab([
        buildCheck({ job: 'slow', target: 'https://a.com', frequency: 10 * ONE_MINUTE }),
      ]);
      const section = await findSection(/alerting/i);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for slow' }));

      expect(within(section).getByText('1 over 10 min')).toBeInTheDocument();
    });
  });

  describe('paused checks', () => {
    it('lists paused checks longest-paused first, saying how long, and links to them', async () => {
      const now = Math.floor(Date.now() / 1000);

      await renderTab([
        buildCheck({
          job: 'recent',
          enabled: false,
          modified: now - DAY_IN_SECONDS,
          alertSensitivity: AlertSensitivity.High,
        }),
        buildCheck({
          job: 'forgotten',
          enabled: false,
          modified: now - 90 * DAY_IN_SECONDS,
          alertSensitivity: AlertSensitivity.High,
        }),
      ]);

      const section = await findSection(/paused checks/i);
      const names = within(section)
        .getAllByRole('link', { name: /^Edit / })
        .map((link) => link.getAttribute('aria-label'));

      expect(names).toEqual(['Edit forgotten', 'Edit recent']);
      expect(within(section).getByText('Paused 3 months ago')).toBeInTheDocument();
      expect(within(section).getByText('Paused a day ago')).toBeInTheDocument();
      expect(within(section).getByRole('link', { name: /review paused checks/i })).toHaveAttribute(
        'href',
        expect.stringContaining('status=disabled')
      );
    });

    it('resumes a paused check in place', async () => {
      const reportInteraction = mockReportInteraction();
      const check = buildCheck({ job: 'forgotten', enabled: false, alertSensitivity: AlertSensitivity.High });
      let resumed = false;

      server.use(
        apiRoute('updateCheck', {
          result: async (req) => {
            const body = (await req.json()) as Check;
            resumed = body.enabled;

            return { json: body };
          },
        }),
        apiRoute('listChecks', { result: () => ({ json: [{ ...check, enabled: !resumed ? false : true }] }) })
      );

      const { user } = render(<RecommendationsTab />);
      const section = await findSection(/paused checks/i);

      await user.click(within(section).getByRole('button', { name: 'Resume forgotten' }));

      expect(resumed).toBe(true);
      await waitFor(() => expect(screen.queryByRole('heading', { name: /paused checks/i })).not.toBeInTheDocument());
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({ finding: 'paused-checks', action: 'check_resumed', checkCount: 1 })
      );
    });
  });

  describe('redundant checks', () => {
    it('hides the checks inside a duplicate group until it is expanded', async () => {
      const { user } = await renderTab([
        buildCheck({ job: 'primary', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
        buildCheck({ job: 'copy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
      ]);

      const section = await findSection(/duplicate checks/i);

      expect(within(section).getByText('https://grafana.com')).toBeInTheDocument();
      expect(within(section).getByText('http · 2 checks')).toBeInTheDocument();
      expect(within(section).queryByText('primary')).not.toBeInTheDocument();

      await user.click(within(section).getByRole('button', { name: /grafana\.com/ }));

      expect(within(section).getByText('primary')).toBeInTheDocument();
      expect(within(section).getByText('copy')).toBeInTheDocument();
    });

    it('links each duplicate group to the check list filtered to that target and type', async () => {
      await renderTab([
        buildCheck({ job: 'primary', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
        buildCheck({ job: 'copy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
      ]);

      const section = await findSection(/duplicate checks/i);

      expect(within(section).getByRole('link', { name: 'Show these checks in the check list' })).toHaveAttribute(
        'href',
        expect.stringContaining('search=https%3A%2F%2Fgrafana.com&type=http')
      );
    });

    it('reports a target covered by more than one check type', async () => {
      await renderTab([
        buildCheck({ job: 'http', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Http),
        buildCheck({ job: 'ping', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Ping),
      ]);

      const section = await findSection(/overlapping targets/i);

      expect(within(section).getByText(/http, ping · 2 checks/)).toBeInTheDocument();
      expect(within(section).getByRole('link', { name: 'Show these checks in the check list' })).toHaveAttribute(
        'href',
        expect.not.stringContaining('type=')
      );
    });
  });

  describe('cost attribution labels', () => {
    const withCalNames = (names: string[]) =>
      server.use(apiRoute('getTenantCostAttributionLabels', { result: () => ({ json: { names } }) }));

    it('reports which cost labels each check is missing and links to its editor', async () => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
      withCalNames(['team', 'env']);

      await renderTab([
        buildCheck({
          id: 12,
          job: 'unattributed',
          alertSensitivity: AlertSensitivity.High,
          target: 'https://a.com',
          labels: [{ name: 'env', value: 'prod' }],
        }),
      ]);

      const section = await findSection(/cost attribution/i);

      expect(within(section).getByText('Missing team')).toBeInTheDocument();
      expect(within(section).getByRole('link', { name: 'Add labels to unattributed' })).toHaveAttribute(
        'href',
        expect.stringContaining('/checks/12/edit')
      );
      expect(within(section).getByRole('link', { name: /view in check list/i })).toHaveAttribute(
        'href',
        expect.stringContaining('__unattributed__')
      );
    });

    it('stays quiet when the feature is off, even with unlabelled checks', async () => {
      mockFeatureToggles({ [FeatureName.CALs]: false });
      withCalNames(['team']);

      await renderTab([
        buildCheck({ job: 'unattributed', alertSensitivity: AlertSensitivity.High, target: 'https://a.com' }),
      ]);

      expect(await screen.findByText(/nothing needs your attention/i)).toBeInTheDocument();
    });
  });

  describe('dismissing', () => {
    it('hides a dismissed finding, remembers it, and can bring it back', async () => {
      const reportInteraction = mockReportInteraction();
      const { user } = await renderTab([
        buildCheck({ job: 'unalerted', target: 'https://a.com' }),
        buildCheck({ job: 'forgotten', enabled: false, alertSensitivity: AlertSensitivity.High }),
      ]);

      await user.click(within(await findSection(/alerting/i)).getByRole('button', { name: 'Dismiss this finding' }));

      expect(screen.queryByRole('heading', { name: /alerting/i })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /paused checks/i })).toBeInTheDocument();
      expect(screen.getByText('1 finding dismissed')).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(DISMISSED_FINDINGS_STORAGE_KEY)!)).toEqual(['alerting-gaps']);
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_dismissed',
        expect.objectContaining({ finding: 'alerting-gaps' })
      );

      await user.click(screen.getByRole('button', { name: /show dismissed/i }));

      expect(await findSection(/alerting/i)).toBeInTheDocument();
      expect(screen.queryByText(/finding dismissed/i)).not.toBeInTheDocument();
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_restored',
        expect.objectContaining({ finding: 'alerting-gaps' })
      );
    });

    it('does not count impressions for findings the user has dismissed', async () => {
      localStorage.setItem(DISMISSED_FINDINGS_STORAGE_KEY, JSON.stringify(['alerting-gaps']));
      const reportInteraction = mockReportInteraction();

      await renderTab([
        buildCheck({ job: 'unalerted', target: 'https://a.com' }),
        buildCheck({ job: 'forgotten', enabled: false, alertSensitivity: AlertSensitivity.High }),
      ]);

      await findSection(/paused checks/i);

      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_tab_viewed',
        expect.objectContaining({ findingCount: 2, dismissedCount: 1, checkCount: 2 })
      );
      expect(reportInteraction).not.toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_shown',
        expect.objectContaining({ finding: 'alerting-gaps' })
      );
    });
  });

  it('collapses a finding when its heading is clicked', async () => {
    const { user } = await renderTab([buildCheck({ job: 'unalerted', target: 'https://a.com' })]);

    const section = await findSection(/alerting/i);
    expect(within(section).getByText('unalerted')).toBeInTheDocument();

    await user.click(within(section).getByRole('button', { name: /^Alerting/, expanded: true }));

    expect(within(section).queryByText('unalerted')).not.toBeInTheDocument();
  });

  it('pages the rows rather than listing every affected check at once', async () => {
    const checks = Array.from({ length: 9 }, (_, index) =>
      buildCheck({ job: `unalerted-${index}`, target: `https://${index}.com` })
    );

    await renderTab(checks);

    const section = await findSection(/alerting/i);

    expect(within(section).getByText('unalerted-0')).toBeInTheDocument();
    expect(within(section).queryByText('unalerted-8')).not.toBeInTheDocument();
    expect(within(section).getByRole('navigation')).toBeInTheDocument();
  });

  it('says nothing needs attention when every check is well configured', async () => {
    await renderTab([
      buildCheck({ job: 'healthy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
    ]);

    expect(await screen.findByText(/nothing needs your attention/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId(RECOMMENDATIONS_TEST_ID.section)).toHaveLength(0);
  });

  describe('feedback', () => {
    it('collects a reaction and a comment', async () => {
      const reportInteraction = mockReportInteraction();

      const { user } = await renderTab([buildCheck({ job: 'unalerted', target: 'https://a.com' })]);

      await user.click(await screen.findByRole('button', { name: /i love this feature/i }));
      await user.type(screen.getByRole('textbox', { name: /additional comments/i }), 'useful');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_feature_feedback_feature_feedback_submitted',
        expect.objectContaining({ feature: 'recommendations', reaction: 'good' })
      );
    });

    // Finding nothing worth showing is as useful a signal as a finding being wrong.
    it('is available even when there is nothing to report', async () => {
      await renderTab([
        buildCheck({ job: 'healthy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
      ]);

      expect(await screen.findByRole('button', { name: /i don't like this feature/i })).toBeInTheDocument();
    });
  });

  it('sends people to create a check when they have none', async () => {
    await renderTab([]);

    expect(await screen.findByText(/haven't created any checks yet/i)).toBeInTheDocument();
  });

  it('recovers from a failed check request', async () => {
    server.use(apiRoute('listChecks', { result: () => ({ status: 500, body: 'nope' }) }));

    render(<RecommendationsTab />);

    expect(await screen.findByRole('button', { name: /retry request/i })).toBeInTheDocument();
  });
});
