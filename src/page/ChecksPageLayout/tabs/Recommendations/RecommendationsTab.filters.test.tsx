import { screen, waitFor, within } from '@testing-library/react';
import { RECOMMENDATIONS_TEST_ID, ROUTER_TEST_ID } from 'test/dataTestIds';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { mockReportInteraction } from 'test/utils';

import { RecommendationCategoryId } from './Recommendations.types';
import { AlertSensitivity, CheckType } from 'types';

import { buildCheck, findSection, rail, renderCategory, renderTab } from './__testHelpers__/recommendationsTab';
import { DISMISSED_CHECKS_STORAGE_KEY, DISMISSED_FINDINGS_STORAGE_KEY } from './Recommendations.constants';

const UNALERTED_HTTP = () => buildCheck({ id: 1, job: 'unalerted-http', target: 'https://a.com' });
const UNALERTED_DNS = () => buildCheck({ id: 2, job: 'unalerted-dns', target: 'a.com' }, CheckType.Dns);
const UNALERTED_HTTP_2 = () => buildCheck({ id: 3, job: 'unalerted-http-2', target: 'https://c.com' });
const PAUSED_DNS = () =>
  buildCheck(
    { id: 4, job: 'paused-dns', target: 'b.com', enabled: false, alertSensitivity: AlertSensitivity.High },
    CheckType.Dns
  );
const DUPLICATE_HTTP = () => [
  buildCheck({ id: 5, job: 'primary', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
  buildCheck({ id: 6, job: 'copy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
];
const DUPLICATE_DNS = () => [
  buildCheck({ id: 10, job: 'dns-primary', target: 'dup.com', alertSensitivity: AlertSensitivity.High }, CheckType.Dns),
  buildCheck({ id: 11, job: 'dns-copy', target: 'dup.com', alertSensitivity: AlertSensitivity.High }, CheckType.Dns),
];
// In no finding, so its type filters everything out.
const HEALTHY_PING = () =>
  buildCheck(
    { id: 7, job: 'healthy-ping', target: 'grafana.net', alertSensitivity: AlertSensitivity.High },
    CheckType.Ping
  );

const railItems = () =>
  within(rail())
    .getAllByRole('button')
    .map((button) => button.textContent);

describe('Recommendations tab filters', () => {
  beforeEach(() => {
    localStorage.clear();
    // The default tenant has cost labels, so the cost finding would join every test.
    server.use(apiRoute('getTenantCostAttributionLabels', { result: () => ({ json: { names: [] } }) }));
  });

  it('offers each check type in an open, collapsible Type group, outside the category navigation', async () => {
    const { user } = await renderTab([UNALERTED_HTTP(), PAUSED_DNS()]);

    const type = await screen.findByRole('button', { name: 'Type' });
    expect(type).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: 'dns' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'http' })).not.toBeChecked();
    expect(railItems()).toEqual(['Needs attention', 'Alerting1', 'Paused checks1']);

    await user.click(type);

    expect(type).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('checkbox', { name: 'dns' })).not.toBeInTheDocument();
  });

  it('counts only matching checks in the rail, keeping categories with none', async () => {
    const { user } = await renderTab([UNALERTED_HTTP(), PAUSED_DNS(), ...DUPLICATE_HTTP()]);

    await user.click(await screen.findByRole('checkbox', { name: 'dns' }));

    expect(railItems()).toEqual(['Needs attention', 'Alerting0', 'Paused checks1', 'Redundancy0']);
  });

  it('rewrites the landing rows around the filters, hiding the action where nothing matches', async () => {
    const { user } = await renderTab([UNALERTED_HTTP(), UNALERTED_DNS(), PAUSED_DNS()]);

    await user.click(await screen.findByRole('checkbox', { name: 'http' }));

    const [alerting, paused] = screen.getAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);
    expect(within(alerting).getByText('1 of 2 checks match your filters')).toBeInTheDocument();
    expect(within(alerting).getByText('Review')).toBeVisible();
    expect(within(paused).getByText('0 of 1 check matches your filters')).toBeInTheDocument();
    expect(within(paused).getByText('Review')).not.toBeVisible();
  });

  it('counts a matching dismissed row in the panel, as the landing row does', async () => {
    localStorage.setItem(DISMISSED_CHECKS_STORAGE_KEY, JSON.stringify({ 'alerting-gaps': [1] }));
    const { user } = await renderTab([UNALERTED_HTTP(), UNALERTED_DNS(), UNALERTED_HTTP_2()], {
      path: 'checks/recommendations?type=http',
    });

    const [alerting] = await screen.findAllByTestId(RECOMMENDATIONS_TEST_ID.attentionRow);
    expect(within(alerting).getByText('2 of 3 checks match your filters')).toBeInTheDocument();

    await user.click(alerting);

    const section = await findSection(/2 of 3 checks match your filters/);
    expect(within(section).getByText('unalerted-http-2')).toBeInTheDocument();
    expect(within(section).queryByText('unalerted-http')).not.toBeInTheDocument();
  });

  it('does not blame the filters when every matching row was dismissed', async () => {
    localStorage.setItem(DISMISSED_CHECKS_STORAGE_KEY, JSON.stringify({ 'alerting-gaps': [1, 3] }));

    await renderTab([UNALERTED_HTTP(), UNALERTED_DNS(), UNALERTED_HTTP_2()], {
      path: 'checks/recommendations?category=alerting&type=http',
    });

    const section = await findSection(/2 of 3 checks match your filters/);
    expect(within(section).getByText(/2 checks dismissed/)).toBeInTheDocument();
    expect(within(section).queryByText('No checks in this finding match your filters.')).not.toBeInTheDocument();
  });

  it('says how many checks match and which finding leads, counting only those in the legend', async () => {
    const { user } = await renderTab([UNALERTED_HTTP(), PAUSED_DNS(), ...DUPLICATE_HTTP(), HEALTHY_PING()]);
    expect(
      await screen.findByText('4 of 5 checks need attention. Alerting is the gap to close first.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'dns' }));

    expect(
      screen.getByText('1 of 4 checks match your filters. Paused checks is the gap to close first.')
    ).toBeInTheDocument();
    expect(screen.getByTestId(RECOMMENDATIONS_TEST_ID.legend)).toHaveTextContent(/^1 warning$/);

    await user.click(screen.getByRole('checkbox', { name: 'dns' }));
    await user.click(screen.getByRole('checkbox', { name: 'ping' }));

    expect(screen.getByText('No checks match your filters.')).toBeInTheDocument();
    expect(screen.queryByTestId(RECOMMENDATIONS_TEST_ID.legend)).not.toBeInTheDocument();
  });

  it('narrows a finding to its matching checks and sets up alerts for just those', async () => {
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
    const { user } = await renderCategory(
      [UNALERTED_HTTP(), UNALERTED_DNS(), UNALERTED_HTTP_2()],
      RecommendationCategoryId.Alerting
    );

    await user.click(await screen.findByRole('checkbox', { name: 'http' }));

    const section = await findSection(/2 of 3 checks match your filters/);
    expect(within(section).queryByText('unalerted-dns')).not.toBeInTheDocument();

    await user.click(within(section).getByRole('button', { name: 'Set up alerts for 2 matching checks' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Set up alerts for matching checks')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Add alerts' }));

    await waitFor(() => expect(updatedCheckIds.sort()).toEqual(['1', '3']));
    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_recommendations_action_completed',
      expect.objectContaining({ finding: 'alerting-gaps', action: 'alerts_added', checkCount: 2, scope: 'filtered' })
    );
  });

  it('lets ticked rows win over the matching checks', async () => {
    const { user } = await renderTab([UNALERTED_HTTP(), UNALERTED_DNS(), UNALERTED_HTTP_2()], {
      path: 'checks/recommendations?category=alerting&type=http',
    });

    const section = await findSection(/2 of 3 checks match your filters/);
    expect(screen.getByRole('checkbox', { name: 'http' })).toBeChecked();

    await user.click(within(section).getByRole('checkbox', { name: 'Select unalerted-http' }));

    expect(within(section).getByRole('button', { name: 'Set up alerts for 1 check' })).toBeInTheDocument();
  });

  it('keeps a finding with no matching checks in place, saying so, with nothing to act on', async () => {
    await renderTab([UNALERTED_HTTP(), HEALTHY_PING()], { path: 'checks/recommendations?category=alerting&type=ping' });

    const section = await findSection(/0 of 1 check matches your filters/);

    expect(within(section).getByText('No checks in this finding match your filters.')).toBeInTheDocument();
    expect(within(section).queryByRole('button', { name: /^Set up alerts/ })).not.toBeInTheDocument();
  });

  it('drops redundancy groups with no matching checks and lists what is left of the rest', async () => {
    const { user } = await renderTab(
      [
        ...DUPLICATE_HTTP(),
        ...DUPLICATE_DNS(),
        buildCheck(
          { id: 12, job: 'dns-on-example', target: 'example.com', alertSensitivity: AlertSensitivity.High },
          CheckType.Dns
        ),
        buildCheck(
          { id: 13, job: 'ping-on-example', target: 'example.com', alertSensitivity: AlertSensitivity.High },
          CheckType.Ping
        ),
      ],
      { path: 'checks/recommendations?category=redundancy&type=dns' }
    );

    const duplicates = await findSection(/Duplicate checks/);
    expect(within(duplicates).getByText('2 of 4 checks match your filters')).toBeInTheDocument();
    expect(within(duplicates).getByRole('button', { name: 'dup.com' })).toBeInTheDocument();
    expect(within(duplicates).queryByRole('button', { name: 'https://grafana.com' })).not.toBeInTheDocument();

    const overlapping = await findSection(/Overlapping targets/);
    expect(within(overlapping).getByText('1 of 2 checks match your filters')).toBeInTheDocument();
    expect(within(overlapping).getByText('dns · 1 check')).toBeInTheDocument();

    await user.click(within(overlapping).getByRole('button', { name: 'example.com' }));
    await user.click(within(overlapping).getByRole('button', { name: 'Dismiss dns-on-example from this finding' }));

    // The ping check the filters hide is no longer redundant either, so it goes with it.
    expect(await within(overlapping).findByText(/2 checks dismissed/)).toBeInTheDocument();
  });

  it('counts the filters set and clears them all at once', async () => {
    const { user } = await renderTab([UNALERTED_HTTP(), PAUSED_DNS()], {
      path: 'checks/recommendations?type=http&type=dns',
    });

    expect(await screen.findByText('2 filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByRole('checkbox', { name: 'http' })).not.toBeChecked();
    expect(screen.queryByText('2 filters')).not.toBeInTheDocument();
    expect(screen.getByTestId(ROUTER_TEST_ID.search)).not.toHaveTextContent('type');
  });

  it('keeps the filters in the URL as the rail moves between categories', async () => {
    const { user } = await renderTab([UNALERTED_HTTP(), PAUSED_DNS()]);

    await user.click(await screen.findByRole('checkbox', { name: 'dns' }));
    await waitFor(() => expect(screen.getByTestId(ROUTER_TEST_ID.search).textContent).toBe('?type=dns'));

    await user.click(within(rail()).getByRole('button', { name: /^Paused checks/ }));

    expect(screen.getByTestId(ROUTER_TEST_ID.search).textContent).toBe('?type=dns&category=paused');
    expect(screen.getByRole('checkbox', { name: 'dns' })).toBeChecked();
  });

  it('still offers a type from a shared link that no check has, so it can be unticked', async () => {
    const { user } = await renderTab([UNALERTED_HTTP()], { path: 'checks/recommendations?type=grpc' });

    const grpc = await screen.findByRole('checkbox', { name: 'grpc' });
    expect(grpc).toBeChecked();

    await user.click(grpc);

    await waitFor(() => expect(screen.getByTestId(ROUTER_TEST_ID.search).textContent).toBe(''));
  });

  it('does not blame the filters for a page emptied by dismissals', async () => {
    localStorage.setItem(DISMISSED_FINDINGS_STORAGE_KEY, JSON.stringify(['alerting-gaps']));

    await renderTab([UNALERTED_HTTP()], { path: 'checks/recommendations?type=http' });

    expect(await screen.findByText('1 finding dismissed')).toBeInTheDocument();
    expect(screen.queryByText('No checks match your filters.')).not.toBeInTheDocument();
  });

  it('reads as unfiltered when every row of a finding was dismissed', async () => {
    localStorage.setItem(DISMISSED_CHECKS_STORAGE_KEY, JSON.stringify({ 'alerting-gaps': [1] }));

    await renderTab([UNALERTED_HTTP()], { path: 'checks/recommendations?category=alerting&type=http' });

    const section = await findSection(/1 of 1 checks have no alerts/);
    expect(within(section).queryByText('No checks in this finding match your filters.')).not.toBeInTheDocument();
  });
});
