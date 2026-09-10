import React from 'react';
import { screen, within } from '@testing-library/react';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';
import { DB } from 'test/db';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { AlertSensitivity, Check, CheckType, FeatureName } from 'types';

import { RecommendationsTab } from './RecommendationsTab';

function buildCheck(overrides: Partial<Check>, type = CheckType.Http): Check {
  return DB.check.build(
    { alertSensitivity: AlertSensitivity.None, alerts: [], enabled: true, labels: [], ...overrides },
    { transient: { type } }
  );
}

function renderTab(checks: Check[]) {
  server.use(apiRoute('listChecks', { result: () => ({ json: checks }) }));

  return render(<RecommendationsTab />);
}

async function findCard(name: RegExp) {
  const heading = await screen.findByRole('heading', { name });

  return heading.closest(`[data-testid="${RECOMMENDATIONS_TEST_ID.card}"]`) as HTMLElement;
}

describe('Recommendations tab', () => {
  it('reports checks that are running without alerting and links to them', async () => {
    await renderTab([
      buildCheck({ job: 'unalerted', target: 'https://a.com' }),
      buildCheck({ job: 'alerted', target: 'https://b.com', alertSensitivity: AlertSensitivity.High }),
    ]);

    const card = await findCard(/running without alerts/i);

    expect(within(card).getByLabelText('Affected checks: 1')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /set up alerts/i })).toHaveAttribute(
      'href',
      expect.stringContaining('alerts=without&status=enabled')
    );
  });

  it('reports paused checks and links to the disabled checks', async () => {
    await renderTab([buildCheck({ job: 'forgotten', enabled: false, alertSensitivity: AlertSensitivity.High })]);

    const card = await findCard(/paused checks/i);

    expect(within(card).getByRole('link', { name: /review paused checks/i })).toHaveAttribute(
      'href',
      expect.stringContaining('status=disabled')
    );
  });

  it('lists each duplicated target as its own group', async () => {
    await renderTab([
      buildCheck({ job: 'primary', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
      buildCheck({ job: 'copy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
    ]);

    const card = await findCard(/duplicate checks/i);

    expect(within(card).getByRole('link', { name: 'https://grafana.com' })).toBeInTheDocument();
    expect(within(card).getByText(/2 checks/)).toBeInTheDocument();
  });

  it('reports a target covered by more than one check type', async () => {
    await renderTab([
      buildCheck({ job: 'http', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Http),
      buildCheck({ job: 'ping', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Ping),
    ]);

    expect(await findCard(/several check types/i)).toBeInTheDocument();
  });

  it('says nothing needs attention when every check is well configured', async () => {
    await renderTab([
      buildCheck({ job: 'healthy', target: 'https://grafana.com', alertSensitivity: AlertSensitivity.High }),
    ]);

    expect(await screen.findByText(/nothing needs your attention/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId(RECOMMENDATIONS_TEST_ID.card)).toHaveLength(0);
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

  describe('cost attribution labels', () => {
    const withCalNames = (names: string[]) =>
      server.use(apiRoute('getTenantCostAttributionLabels', { result: () => ({ json: { names } }) }));

    it('reports checks missing a tenant cost label', async () => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
      withCalNames(['team']);

      await renderTab([
        buildCheck({ job: 'unattributed', alertSensitivity: AlertSensitivity.High, target: 'https://a.com' }),
      ]);

      const card = await findCard(/missing cost attribution labels/i);

      expect(within(card).getByRole('link', { name: /add labels/i })).toHaveAttribute(
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
});
