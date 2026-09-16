import React from 'react';
import { locationService } from '@grafana/runtime';
import appEvents from 'grafana/app/core/app_events';
import { screen, waitFor, within } from '@testing-library/react';
import { RECOMMENDATIONS_TEST_ID, ROUTER_TEST_ID } from 'test/dataTestIds';
import { DB } from 'test/db';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { RecommendationCategoryId } from './Recommendations.types';
import { AlertSensitivity, Check, CheckAlertDraft, CheckAlertType, CheckType, FeatureName } from 'types';

import { DISMISSED_CHECKS_STORAGE_KEY, DISMISSED_FINDINGS_STORAGE_KEY } from './Recommendations.constants';
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

type RenderOptions = Parameters<typeof render>[1];

function renderTab(checks: Check[], options?: RenderOptions) {
  server.use(apiRoute('listChecks', { result: () => ({ json: checks }) }));

  return render(<RecommendationsTab />, options);
}

/** Lands straight on one category, the way the rail or a `?category=` link would. */
function renderCategory(checks: Check[], category: RecommendationCategoryId, options?: RenderOptions) {
  return renderTab(checks, { ...options, path: `checks/recommendations?category=${category}` });
}

/** Toasts go through app_events, which the test setup stubs; spy on it to read the message. */
function spyOnToasts() {
  return jest.spyOn(appEvents, 'emit').mockImplementation(() => {});
}

function mockReportInteraction() {
  const reportInteraction = jest.fn();
  jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;

  return reportInteraction;
}

/**
 * A finding's panel, found by its heading. A category with one finding leads with the summary
 * ("1 of 2 checks have no alerts"); one with several leads with each finding's name.
 */
async function findSection(name: RegExp) {
  const heading = await screen.findByRole('heading', { name });

  return heading.closest(`[data-testid="${RECOMMENDATIONS_TEST_ID.section}"]`) as HTMLElement;
}

const rail = () => screen.getByRole('navigation', { name: 'Recommendation categories' });

/** Which rail item is current, by its visible text (the check count is part of the button). */
function activeRailItem() {
  return within(rail())
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-current') === 'page')?.textContent;
}

const UNALERTED = () => buildCheck({ job: 'unalerted', target: 'https://a.com' });
const PAUSED = () => buildCheck({ job: 'forgotten', enabled: false, alertSensitivity: AlertSensitivity.High });
const DUPLICATES = () => [
  buildCheck({ job: 'primary', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
  buildCheck({ job: 'copy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
];

describe('Recommendations tab', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('landing view', () => {
    it('lists one row per category with what is wrong and what the category offers', async () => {
      await renderTab([UNALERTED(), PAUSED(), ...DUPLICATES()]);

      const rows = await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);

      expect(rows.map((row) => row.textContent)).toEqual([
        'Alerting1 of 4 checks have no alertsView in check list',
        'Paused checks1 of 4 checks are pausedReview paused checks',
        'Redundancy2 of 4 checks are duplicates across 1 targetsReview',
      ]);
      expect(screen.queryAllByTestId(RECOMMENDATIONS_TEST_ID.section)).toHaveLength(0);
    });

    it('rolls up a category that holds several findings', async () => {
      await renderTab([
        // The same target once by type (duplicates) and across types (overlap): three checks, two findings.
        ...DUPLICATES(),
        buildCheck(
          { job: 'ping', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High },
          CheckType.Ping
        ),
      ]);

      const [row] = await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);

      expect(row).toHaveTextContent('Redundancy3 of 3 checks across 2 findingsReview 2 findings');
    });

    it('sums up how much of the fleet needs attention and what to tackle first', async () => {
      await renderTab([
        // Unalerted and a duplicate: counted once.
        buildCheck({ job: 'primary', target: 'https://grafana.com' }),
        buildCheck({ job: 'copy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
        buildCheck({ job: 'healthy', target: 'https://b.com', alertSensitivity: AlertSensitivity.High }),
      ]);

      expect(
        await screen.findByText('2 of 3 checks need attention. Alerting is the gap to close first.')
      ).toBeInTheDocument();
    });

    it('opens a category when its row is clicked and reflects it in the URL', async () => {
      const { user } = await renderTab([UNALERTED(), PAUSED()]);

      await user.click((await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow))[1]);

      expect(await findSection(/checks are paused/)).toBeInTheDocument();
      expect(screen.getByTestId(ROUTER_TEST_ID.search)).toHaveTextContent('?category=paused');
      expect(activeRailItem()).toBe('Paused checks1');
      // A history entry, so Back returns to the landing view rather than leaving the tab.
      expect(locationService.push).toHaveBeenCalledWith(expect.stringContaining('?category=paused'));
      expect(locationService.replace).not.toHaveBeenCalled();
    });

    it('promises the same action the panel will offer, leaving out dismissed rows', async () => {
      localStorage.setItem(DISMISSED_CHECKS_STORAGE_KEY, JSON.stringify({ 'alerting-gaps': [1] }));

      await renderTab([
        buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
        buildCheck({ job: 'two', target: 'https://b.com', id: 2 }),
        buildCheck({ job: 'three', target: 'https://c.com', id: 3 }),
      ]);

      const [row] = await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);

      // The summary still counts every check (hiding a row is not fixing it); the action does not.
      expect(row).toHaveTextContent('Alerting3 of 3 checks have no alertsSet up alerts for all 2');
    });
  });

  describe('rail', () => {
    it('counts checks rather than findings, each check once', async () => {
      await renderTab([
        UNALERTED(),
        // In both redundancy findings; counted once for the category.
        ...DUPLICATES(),
        buildCheck(
          { job: 'ping', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High },
          CheckType.Ping
        ),
      ]);

      await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);
      const items = within(rail())
        .getAllByRole('button')
        .map((button) => button.textContent);

      expect(items).toEqual(['Needs attention', 'Alerting1', 'Redundancy3']);
      expect(activeRailItem()).toBe('Needs attention');
    });

    it('switches between categories and back to the landing view', async () => {
      const { user } = await renderTab([UNALERTED(), PAUSED()]);
      await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);

      await user.click(within(rail()).getByRole('button', { name: /^Alerting/ }));

      expect(await findSection(/checks have no alerts/)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /checks are paused/ })).not.toBeInTheDocument();
      expect(screen.getByText('Checks that are running but would fail silently.')).toBeInTheDocument();

      await user.click(within(rail()).getByRole('button', { name: 'Needs attention' }));

      expect(await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow)).toHaveLength(2);
    });

    it('drops a category once nothing in it is left to show', async () => {
      const { user } = await renderCategory([UNALERTED(), PAUSED()], RecommendationCategoryId.Alerting);

      await user.click(
        within(await findSection(/have no alerts/)).getByRole('button', { name: 'Dismiss this finding' })
      );

      // The URL still says alerting, but there is nothing to show there: land instead.
      expect(await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow)).toHaveLength(1);
      expect(within(rail()).queryByRole('button', { name: /^Alerting/ })).not.toBeInTheDocument();
      expect(activeRailItem()).toBe('Needs attention');
    });
  });

  describe('impressions', () => {
    it('counts a finding as shown only once its panel is on screen, and only once', async () => {
      const reportInteraction = mockReportInteraction();
      const { user } = await renderTab([UNALERTED(), PAUSED()]);
      await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);

      // The landing view lists categories, not findings: nothing has been seen yet.
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_tab_viewed',
        expect.anything()
      );
      expect(reportInteraction).not.toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_shown',
        expect.anything()
      );

      await user.click(within(rail()).getByRole('button', { name: /^Alerting/ }));
      await findSection(/have no alerts/);
      await user.click(within(rail()).getByRole('button', { name: 'Needs attention' }));
      await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);
      await user.click(within(rail()).getByRole('button', { name: /^Alerting/ }));
      await findSection(/have no alerts/);

      const shown = reportInteraction.mock.calls.filter(
        ([event]) => event === 'synthetic-monitoring_recommendations_finding_shown'
      );
      expect(shown).toEqual([
        ['synthetic-monitoring_recommendations_finding_shown', expect.objectContaining({ finding: 'alerting-gaps' })],
      ]);
    });
  });

  describe('legend', () => {
    it('counts checks per severity across everything on the landing view', async () => {
      await renderTab([
        // Unalerted and paused would be two findings; as one check it is counted once per severity.
        UNALERTED(),
        PAUSED(),
        buildCheck({ job: 'also-paused', enabled: false, alertSensitivity: AlertSensitivity.High }),
        ...DUPLICATES(),
      ]);

      const legend = await screen.findByTestId(RECOMMENDATIONS_TEST_ID.legend);

      expect(legend).toHaveTextContent('1 critical2 warning2 info');
    });

    it('narrows to the open category', async () => {
      await renderCategory([UNALERTED(), PAUSED()], RecommendationCategoryId.Paused);

      await findSection(/checks are paused/);

      expect(screen.getByTestId(RECOMMENDATIONS_TEST_ID.legend)).toHaveTextContent('1 warning');
    });
  });

  describe('alerting gaps', () => {
    it('leads with the summary, since the category is already the heading, and links to the list', async () => {
      await renderCategory(
        [UNALERTED(), buildCheck({ job: 'alerted', target: 'https://b.com', alertSensitivity: AlertSensitivity.High })],
        RecommendationCategoryId.Alerting
      );

      const section = await findSection(/1 of 2 checks have no alerts/);

      expect(within(section).getByText('unalerted')).toBeInTheDocument();
      expect(within(section).queryByText('alerted')).not.toBeInTheDocument();
      expect(within(section).queryByRole('heading', { name: 'Alerting' })).not.toBeInTheDocument();
      // The tooltip tells sibling findings apart; a category with one finding has none to tell apart.
      expect(section.querySelector('[name="info-circle"]')).toBeNull();
      expect(within(section).getByRole('link', { name: /view in check list/i })).toHaveAttribute(
        'href',
        expect.stringContaining('alerts=without&status=enabled')
      );
    });

    it('keeps the header to one button and puts the link out in the footer', async () => {
      await renderCategory(
        [
          buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
          buildCheck({ job: 'two', target: 'https://b.com', id: 2 }),
        ],
        RecommendationCategoryId.Alerting
      );
      const section = await findSection(/have no alerts/);
      const header = within(section).getByTestId(RECOMMENDATIONS_TEST_ID.sectionHeader);

      expect(within(header).getByRole('button', { name: 'Set up alerts for all 2' })).toBeInTheDocument();
      expect(within(header).queryByRole('link', { name: /view in check list/i })).not.toBeInTheDocument();
      expect(within(section).getByRole('link', { name: /view in check list/i })).toBeInTheDocument();
    });

    it('offers each affected check its editor', async () => {
      await renderCategory(
        [buildCheck({ job: 'unalerted', target: 'https://a.com', id: 42 })],
        RecommendationCategoryId.Alerting
      );

      const section = await findSection(/have no alerts/);

      expect(within(section).getByRole('link', { name: 'Edit unalerted' })).toHaveAttribute(
        'href',
        expect.stringContaining('/checks/42/edit')
      );
    });

    it('previews the default alerts for the check type before adding them', async () => {
      const { user } = await renderCategory([UNALERTED()], RecommendationCategoryId.Alerting);
      const section = await findSection(/have no alerts/);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for unalerted' }));

      expect(within(section).getByText('Probe Failed Executions Too High')).toBeInTheDocument();
      expect(within(section).getByText('1 over 5 min')).toBeInTheDocument();
      expect(within(section).getByText('HTTP Request Duration Too High Avg')).toBeInTheDocument();
      expect(within(section).getByText('300ms over 5 min')).toBeInTheDocument();
      expect(within(section).getByText('HTTP Target Certificate Close To Expiring')).toBeInTheDocument();
      expect(within(section).getByText('30d')).toBeInTheDocument();
    });

    it('adds the default alerts to one check, confirms it and drops it from the finding', async () => {
      const reportInteraction = mockReportInteraction();
      const toasts = spyOnToasts();
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

      const { user } = render(<RecommendationsTab />, { path: 'checks/recommendations?category=alerting' });
      const section = await findSection(/have no alerts/);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for unalerted' }));
      await user.click(within(section).getByRole('button', { name: 'Add 3 alerts' }));

      expect(savedAlerts.map((alert) => alert.name)).toEqual([
        CheckAlertType.ProbeFailedExecutionsTooHigh,
        CheckAlertType.TLSTargetCertificateCloseToExpiring,
        CheckAlertType.HTTPRequestDurationTooHighAvg,
      ]);
      await waitFor(() => expect(within(section).queryByText('unalerted')).not.toBeInTheDocument());
      expect(within(section).getByText('also-unalerted')).toBeInTheDocument();
      expect(toasts).toHaveBeenCalledWith(expect.anything(), ['Added 3 alerts to unalerted']);
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({ finding: 'alerting-gaps', action: 'alerts_added', checkCount: 1, scope: 'check' })
      );
    });

    it('adds the default alerts to every unalerted check after confirming', async () => {
      const reportInteraction = mockReportInteraction();
      const toasts = spyOnToasts();
      const updatedCheckIds: string[] = [];

      server.use(
        apiRoute('updateAlertsForCheck', {
          result: (req) => {
            updatedCheckIds.push(new URL(req.url).pathname.split('/').at(-2)!);

            return { json: null };
          },
        })
      );

      const { user } = await renderCategory(
        [
          buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
          buildCheck({ job: 'two', target: 'https://b.com', id: 2 }, CheckType.Scripted),
        ],
        RecommendationCategoryId.Alerting
      );
      const section = await findSection(/have no alerts/);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for all 2' }));

      const dialog = await screen.findByRole('dialog');
      // Three for the HTTP check and the failed-executions alert for the scripted one.
      expect(within(dialog).getByText(/adds 4 alerts across 2 checks/i)).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Add alerts' }));

      await waitFor(() => expect(updatedCheckIds.sort()).toEqual(['1', '2']));
      await waitFor(() => expect(toasts).toHaveBeenCalledWith(expect.anything(), ['Added alerts to 2 checks']));
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({ finding: 'alerting-gaps', action: 'alerts_added', checkCount: 2, scope: 'finding' })
      );
    });

    it('adds alerts to just the ticked checks', async () => {
      const updatedCheckIds: string[] = [];

      server.use(
        apiRoute('updateAlertsForCheck', {
          result: (req) => {
            updatedCheckIds.push(new URL(req.url).pathname.split('/').at(-2)!);

            return { json: null };
          },
        })
      );

      const { user } = await renderCategory(
        [
          buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
          buildCheck({ job: 'two', target: 'https://b.com', id: 2 }),
          buildCheck({ job: 'three', target: 'https://c.com', id: 3 }),
        ],
        RecommendationCategoryId.Alerting
      );
      const section = await findSection(/have no alerts/);

      // One header button: for everything until something is ticked, then for the selection.
      expect(within(section).getByRole('button', { name: 'Set up alerts for all 3' })).toBeInTheDocument();

      await user.click(within(section).getByRole('checkbox', { name: 'Select one' }));

      expect(within(section).getByRole('button', { name: 'Set up alerts for 1 check' })).toBeInTheDocument();

      await user.click(within(section).getByRole('checkbox', { name: 'Select three' }));
      await user.click(within(section).getByRole('button', { name: 'Set up alerts for 2 checks' }));

      // Ticked rows were chosen one by one, so no confirmation stands between them and the action.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() => expect(updatedCheckIds.sort()).toEqual(['1', '3']));
    });

    it('keeps the rows that failed ticked so they can be retried', async () => {
      const reportInteraction = mockReportInteraction();
      server.use(
        apiRoute('updateAlertsForCheck', {
          result: (req) =>
            new URL(req.url).pathname.includes('/2/') ? { status: 500, json: { err: 'nope' } } : { json: null },
        })
      );

      const { user } = await renderCategory(
        [
          buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
          buildCheck({ job: 'two', target: 'https://b.com', id: 2 }),
          buildCheck({ job: 'three', target: 'https://c.com', id: 3 }),
        ],
        RecommendationCategoryId.Alerting
      );
      const section = await findSection(/have no alerts/);

      await user.click(within(section).getByRole('checkbox', { name: 'Select one' }));
      await user.click(within(section).getByRole('checkbox', { name: 'Select two' }));
      await user.click(within(section).getByRole('button', { name: 'Set up alerts for 2 checks' }));

      // The one that went through leaves the selection; the one that failed is still ticked.
      await waitFor(() =>
        expect(within(section).getByRole('button', { name: 'Set up alerts for 1 check' })).toBeInTheDocument()
      );
      expect(within(section).getByRole('checkbox', { name: 'Select two' })).toBeChecked();
      expect(within(section).getByRole('checkbox', { name: 'Select one' })).not.toBeChecked();
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({ finding: 'alerting-gaps', action: 'alerts_added', checkCount: 1, scope: 'selection' })
      );
    });

    it('clears a selection without acting on it', async () => {
      const { user } = await renderCategory(
        [
          buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
          buildCheck({ job: 'two', target: 'https://b.com', id: 2 }),
        ],
        RecommendationCategoryId.Alerting
      );
      const section = await findSection(/have no alerts/);

      await user.click(within(section).getByRole('checkbox', { name: 'Select one' }));
      await user.click(within(section).getByRole('button', { name: 'Clear selection' }));

      expect(within(section).getByRole('checkbox', { name: 'Select one' })).not.toBeChecked();
      expect(within(section).getByRole('button', { name: 'Set up alerts for all 2' })).toBeInTheDocument();
      expect(within(section).queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
    });

    it('keeps the row and reports the failure when the alerts cannot be saved', async () => {
      const toasts = spyOnToasts();
      server.use(apiRoute('updateAlertsForCheck', { result: () => ({ status: 500, json: { err: 'nope' } }) }));

      const { user } = await renderCategory([UNALERTED()], RecommendationCategoryId.Alerting);
      const section = await findSection(/have no alerts/);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for unalerted' }));
      await user.click(within(section).getByRole('button', { name: 'Add 3 alerts' }));

      await waitFor(() => expect(within(section).getByRole('button', { name: 'Add 3 alerts' })).toBeEnabled());
      expect(within(section).queryByText(/alerts added/i)).not.toBeInTheDocument();
      expect(toasts).not.toHaveBeenCalledWith(expect.anything(), [expect.stringMatching(/^Added/)]);
    });

    it('stretches the evaluation period to fit a check that runs less often', async () => {
      const { user } = await renderCategory(
        [buildCheck({ job: 'slow', target: 'https://a.com', frequency: 10 * ONE_MINUTE })],
        RecommendationCategoryId.Alerting
      );
      const section = await findSection(/have no alerts/);

      await user.click(within(section).getByRole('button', { name: 'Set up alerts for slow' }));

      expect(within(section).getByText('1 over 10 min')).toBeInTheDocument();
    });
  });

  describe('paused checks', () => {
    it('lists paused checks longest-paused first, saying how long, and links to them', async () => {
      const now = Math.floor(Date.now() / 1000);

      await renderCategory(
        [
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
        ],
        RecommendationCategoryId.Paused
      );

      const section = await findSection(/2 of 2 checks are paused/);
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
      const check = PAUSED();
      let resumed = false;

      server.use(
        apiRoute('updateCheck', {
          result: async (req) => {
            const body = (await req.json()) as Check;
            resumed = body.enabled;

            return { json: body };
          },
        }),
        apiRoute('listChecks', { result: () => ({ json: [{ ...check, enabled: resumed }] }) })
      );

      const { user } = render(<RecommendationsTab />, { path: 'checks/recommendations?category=paused' });
      const section = await findSection(/checks are paused/);

      await user.click(within(section).getByRole('button', { name: 'Resume forgotten' }));

      expect(resumed).toBe(true);
      await waitFor(() => expect(screen.queryByRole('heading', { name: /checks are paused/ })).not.toBeInTheDocument());
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({ finding: 'paused-checks', action: 'check_resumed', checkCount: 1 })
      );
    });

    it('resumes the ticked checks in one request', async () => {
      const reportInteraction = mockReportInteraction();
      let resumedJobs: string[] = [];

      server.use(
        apiRoute('bulkUpdateChecks', {
          result: async (req) => {
            const body = (await req.json()) as Check[];
            resumedJobs = body.filter((check) => check.enabled).map((check) => check.job);

            return { json: { msg: 'ok' } };
          },
        })
      );

      const { user } = await renderCategory(
        [
          buildCheck({ job: 'one', id: 1, enabled: false, alertSensitivity: AlertSensitivity.High }),
          buildCheck({ job: 'two', id: 2, enabled: false, alertSensitivity: AlertSensitivity.High }),
          buildCheck({ job: 'three', id: 3, enabled: false, alertSensitivity: AlertSensitivity.High }),
        ],
        RecommendationCategoryId.Paused
      );
      const section = await findSection(/checks are paused/);

      // Nothing to resume everything with: some checks are paused on purpose.
      expect(within(section).queryByRole('button', { name: /^Resume .*checks?$/ })).not.toBeInTheDocument();

      await user.click(within(section).getByRole('checkbox', { name: 'Select one' }));
      await user.click(within(section).getByRole('checkbox', { name: 'Select two' }));
      await user.click(within(section).getByRole('button', { name: 'Resume 2 checks' }));

      await waitFor(() => expect(resumedJobs.sort()).toEqual(['one', 'two']));
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_action_completed',
        expect.objectContaining({
          finding: 'paused-checks',
          action: 'check_resumed',
          checkCount: 2,
          scope: 'selection',
        })
      );
    });
  });

  describe('redundant checks', () => {
    it('names both findings, with a tooltip to tell them apart', async () => {
      await renderCategory(
        [
          ...DUPLICATES(),
          buildCheck(
            { job: 'ping', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High },
            CheckType.Ping
          ),
        ],
        RecommendationCategoryId.Redundancy
      );

      const duplicates = await findSection(/duplicate checks/i);
      const overlapping = await findSection(/overlapping targets/i);

      expect(within(duplicates).getByText('2 of 3 checks are duplicates across 1 targets')).toBeInTheDocument();
      expect(duplicates.querySelector('[name="info-circle"]')).not.toBeNull();
      expect(within(overlapping).getByText('3 of 3 checks overlap across 1 targets')).toBeInTheDocument();
    });

    it('hides the checks inside a duplicate group until it is expanded', async () => {
      const { user } = await renderCategory(DUPLICATES(), RecommendationCategoryId.Redundancy);

      // Alone in its category, so it leads with its summary like any other solo finding.
      const section = await findSection(/2 of 2 checks are duplicates across 1 targets/);

      expect(within(section).getByText('https://grafana.com')).toBeInTheDocument();
      expect(within(section).getByText('http · 2 checks')).toBeInTheDocument();
      expect(within(section).queryByText('primary')).not.toBeInTheDocument();

      await user.click(within(section).getByRole('button', { name: /grafana\.com/ }));

      expect(within(section).getByText('primary')).toBeInTheDocument();
      expect(within(section).getByText('copy')).toBeInTheDocument();
    });

    it('shows what sets the checks in a group apart and links each to its editor', async () => {
      const reportInteraction = mockReportInteraction();
      server.use(
        apiRoute('listProbes', {
          result: () => ({
            json: [DB.probe.build({ id: 1, name: 'London' }), DB.probe.build({ id: 2, name: 'Atlanta' })],
          }),
        })
      );
      const { user } = await renderCategory(
        [
          buildCheck({
            id: 10,
            job: 'primary',
            target: 'https://grafana.com',
            alertSensitivity: AlertSensitivity.High,
            probes: [1, 2],
          }),
          buildCheck({
            id: 11,
            job: 'copy',
            target: 'https://grafana.com',
            alertSensitivity: AlertSensitivity.High,
            probes: [1],
            frequency: 5 * ONE_MINUTE,
            enabled: false,
          }),
        ],
        RecommendationCategoryId.Redundancy
      );

      const section = await findSection(/are duplicates/);
      await user.click(within(section).getByRole('button', { name: /grafana\.com/ }));

      expect(await within(section).findByText('Every 1m · Atlanta, London')).toBeInTheDocument();
      expect(within(section).getByText('Every 5m · London · paused')).toBeInTheDocument();

      const editLink = within(section).getByRole('link', { name: 'Open copy in the check editor' });
      expect(editLink).toHaveAttribute('href', expect.stringContaining('/checks/11/edit'));
      // Editing is the action, so the row does not also carry the small edit button.
      expect(within(section).queryByRole('link', { name: 'Edit copy' })).not.toBeInTheDocument();

      await user.click(editLink);

      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_actioned',
        expect.objectContaining({ finding: 'duplicate-checks', scope: 'check' })
      );
    });

    it('links each duplicate group to the check list filtered to that target and type', async () => {
      await renderCategory(DUPLICATES(), RecommendationCategoryId.Redundancy);

      const section = await findSection(/are duplicates/);

      expect(within(section).getByRole('link', { name: 'Show these checks in the check list' })).toHaveAttribute(
        'href',
        expect.stringContaining('search=https%3A%2F%2Fgrafana.com&type=http')
      );
    });

    it('reports a target covered by more than one check type', async () => {
      await renderCategory(
        [
          buildCheck({ job: 'http', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Http),
          buildCheck({ job: 'ping', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Ping),
        ],
        RecommendationCategoryId.Redundancy
      );

      const section = await findSection(/2 of 2 checks overlap across 1 targets/);

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

      await renderCategory(
        [
          buildCheck({
            id: 12,
            job: 'unattributed',
            alertSensitivity: AlertSensitivity.High,
            target: 'https://a.com',
            labels: [{ name: 'env', value: 'prod' }],
          }),
        ],
        RecommendationCategoryId.Cost
      );

      const section = await findSection(/1 of 1 checks are unattributed/);

      expect(within(section).getByText('Missing team')).toBeInTheDocument();
      expect(within(section).getByRole('link', { name: 'Add labels to unattributed' })).toHaveAttribute(
        'href',
        expect.stringContaining('/checks/12/edit')
      );
      expect(within(section).getByRole('link', { name: /view in check list/i })).toHaveAttribute(
        'href',
        expect.stringContaining('__unattributed__')
      );
      // A label needs a value we cannot supply, so there is nothing to do to several rows at once.
      expect(within(section).queryByRole('checkbox')).not.toBeInTheDocument();
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

  describe('dismissing a finding', () => {
    it('hides a dismissed finding, remembers it, and can bring it back', async () => {
      const reportInteraction = mockReportInteraction();
      const { user } = await renderCategory([UNALERTED(), PAUSED()], RecommendationCategoryId.Alerting);

      await user.click(
        within(await findSection(/have no alerts/)).getByRole('button', { name: 'Dismiss this finding' })
      );

      expect(screen.queryByRole('heading', { name: /have no alerts/ })).not.toBeInTheDocument();
      expect(screen.getByText('1 finding dismissed')).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(DISMISSED_FINDINGS_STORAGE_KEY)!)).toEqual(['alerting-gaps']);
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_dismissed',
        expect.objectContaining({ finding: 'alerting-gaps', scope: 'finding' })
      );

      await user.click(screen.getByRole('button', { name: /show dismissed findings/i }));

      // Restored, and the URL's category is showable again.
      expect(await findSection(/have no alerts/)).toBeInTheDocument();
      expect(screen.getByText('No findings dismissed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show dismissed findings/i })).toBeDisabled();
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_restored',
        expect.objectContaining({ finding: 'alerting-gaps', scope: 'finding' })
      );
    });

    it('counts the visit with its dismissals, but not a dismissed finding as shown', async () => {
      localStorage.setItem(DISMISSED_FINDINGS_STORAGE_KEY, JSON.stringify(['alerting-gaps']));
      const reportInteraction = mockReportInteraction();

      await renderCategory([UNALERTED(), PAUSED()], RecommendationCategoryId.Paused);

      await findSection(/checks are paused/);

      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_tab_viewed',
        expect.objectContaining({ findingCount: 2, dismissedCount: 1, checkCount: 2 })
      );
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_shown',
        expect.objectContaining({ finding: 'paused-checks' })
      );
      expect(reportInteraction).not.toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_shown',
        expect.objectContaining({ finding: 'alerting-gaps' })
      );
    });

    it('always offers the restore control, disabled when nothing is dismissed', async () => {
      await renderTab([UNALERTED()]);

      await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);

      expect(screen.getByText('No findings dismissed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show dismissed findings/i })).toBeDisabled();
    });
  });

  describe('dismissing a check', () => {
    it('hides one row, remembers it by check id, and can bring the rows back', async () => {
      const reportInteraction = mockReportInteraction();
      const { user } = await renderCategory(
        [
          buildCheck({ job: 'one', target: 'https://a.com', id: 1 }),
          buildCheck({ job: 'two', target: 'https://b.com', id: 2 }),
        ],
        RecommendationCategoryId.Alerting
      );
      const section = await findSection(/2 of 2 checks have no alerts/);

      await user.click(within(section).getByRole('button', { name: 'Dismiss one from this finding' }));

      expect(within(section).queryByText('one')).not.toBeInTheDocument();
      expect(within(section).getByText('two')).toBeInTheDocument();
      // The finding still states the problem in full; hiding a row is not fixing it.
      expect(within(section).getByRole('heading', { name: /2 of 2 checks have no alerts/ })).toBeInTheDocument();
      expect(within(section).getByText('1 check dismissed')).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(DISMISSED_CHECKS_STORAGE_KEY)!)).toEqual({ 'alerting-gaps': [1] });
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_dismissed',
        expect.objectContaining({ finding: 'alerting-gaps', scope: 'check' })
      );

      await user.click(within(section).getByRole('button', { name: 'Show dismissed checks' }));

      expect(within(section).getByText('one')).toBeInTheDocument();
      expect(within(section).queryByText(/check dismissed/)).not.toBeInTheDocument();
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_finding_restored',
        expect.objectContaining({ finding: 'alerting-gaps', scope: 'check' })
      );
    });

    it('leaves a check dismissed from one finding visible in another', async () => {
      localStorage.setItem(DISMISSED_CHECKS_STORAGE_KEY, JSON.stringify({ 'alerting-gaps': [1] }));
      mockFeatureToggles({ [FeatureName.CALs]: true });
      server.use(apiRoute('getTenantCostAttributionLabels', { result: () => ({ json: { names: ['team'] } }) }));

      await renderCategory([buildCheck({ job: 'one', target: 'https://a.com', id: 1 })], RecommendationCategoryId.Cost);

      expect(within(await findSection(/are unattributed/)).getByText('one')).toBeInTheDocument();
    });
  });

  describe('deep linking', () => {
    const scrollIntoView = jest.fn();

    beforeEach(() => {
      scrollIntoView.mockClear();
      Element.prototype.scrollIntoView = scrollIntoView;
    });

    it('opens the category holding the finding, highlights it and scrolls to it', async () => {
      const reportInteraction = mockReportInteraction();

      await renderTab([UNALERTED(), PAUSED()], { path: 'checks/recommendations?finding=paused-checks' });

      const paused = await findSection(/checks are paused/);

      expect(within(paused).getByText('Opened from a link')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /have no alerts/ })).not.toBeInTheDocument();
      expect(activeRailItem()).toBe('Paused checks1');
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_recommendations_tab_viewed',
        expect.objectContaining({ focusSource: 'paused-checks' })
      );
    });

    it('lets go of the focus once another view is chosen', async () => {
      const { user } = await renderTab([UNALERTED(), PAUSED()], {
        path: 'checks/recommendations?finding=paused-checks',
      });
      await findSection(/checks are paused/);

      await user.click(within(rail()).getByRole('button', { name: /^Alerting/ }));

      expect(await findSection(/have no alerts/)).toBeInTheDocument();
      expect(screen.getByTestId(ROUTER_TEST_ID.search)).toHaveTextContent('?category=alerting');
      expect(screen.queryByText('Opened from a link')).not.toBeInTheDocument();
    });

    it('lands on the overview for a finding or category it does not know', async () => {
      await renderTab([UNALERTED()], { path: 'checks/recommendations?finding=nonsense&category=nonsense' });

      expect(await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow)).toHaveLength(1);
      expect(screen.queryByText('Opened from a link')).not.toBeInTheDocument();
      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });

  it('collapses a finding when its heading is clicked, keeping the heading', async () => {
    const { user } = await renderCategory([UNALERTED()], RecommendationCategoryId.Alerting);

    const section = await findSection(/have no alerts/);
    expect(within(section).getByText('unalerted')).toBeInTheDocument();

    await user.click(within(section).getByRole('button', { name: /have no alerts/, expanded: true }));

    expect(within(section).queryByText('unalerted')).not.toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: /1 of 1 checks have no alerts/ })).toBeInTheDocument();
  });

  it('pages the rows only once a finding outgrows a screen', async () => {
    const buildMany = (count: number) =>
      Array.from({ length: count }, (_, index) =>
        buildCheck({ job: `unalerted-${index}`, target: `https://${index}.com` })
      );

    const { unmount } = await renderCategory(buildMany(25), RecommendationCategoryId.Alerting);
    let section = await findSection(/have no alerts/);

    expect(within(section).getByText('unalerted-24')).toBeInTheDocument();
    expect(within(section).queryByRole('navigation')).not.toBeInTheDocument();

    unmount();
    await renderCategory(buildMany(26), RecommendationCategoryId.Alerting);
    section = await findSection(/have no alerts/);

    // Rows sort by name, so it is the lexically last one that falls onto the second page.
    expect(within(section).getByText('unalerted-0')).toBeInTheDocument();
    expect(within(section).queryByText('unalerted-9')).not.toBeInTheDocument();
    expect(within(section).getByRole('navigation')).toBeInTheDocument();
  });

  it('says nothing needs attention when every check is well configured', async () => {
    await renderTab([
      buildCheck({ job: 'healthy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
    ]);

    expect(await screen.findByText(/nothing needs your attention/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId(RECOMMENDATIONS_TEST_ID.section)).toHaveLength(0);
    expect(screen.queryAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow)).toHaveLength(0);
  });

  describe('feedback', () => {
    it('collects a reaction and a comment', async () => {
      const reportInteraction = mockReportInteraction();

      const { user } = await renderTab([UNALERTED()]);

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
