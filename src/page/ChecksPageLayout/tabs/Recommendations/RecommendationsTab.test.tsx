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

async function findSection(name: RegExp) {
  const heading = await screen.findByRole('heading', { name });

  return heading.closest(`[data-testid="${RECOMMENDATIONS_TEST_ID.section}"]`) as HTMLElement;
}

describe('Recommendations tab', () => {
  it('reports checks that are running without alerting and links to them', async () => {
    await renderTab([
      buildCheck({ job: 'unalerted', target: 'https://a.com' }),
      buildCheck({ job: 'alerted', target: 'https://b.com', alertSensitivity: AlertSensitivity.High }),
    ]);

    const section = await findSection(/alerting/i);

    expect(within(section).getByText('1 of 2 checks have no alerts')).toBeInTheDocument();
    expect(within(section).getByText('unalerted')).toBeInTheDocument();
    expect(within(section).queryByText('alerted')).not.toBeInTheDocument();
    expect(within(section).getByRole('link', { name: /set up alerts/i })).toHaveAttribute(
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

  it('reports paused checks and links to the disabled checks', async () => {
    await renderTab([buildCheck({ job: 'forgotten', enabled: false, alertSensitivity: AlertSensitivity.High })]);

    const section = await findSection(/paused checks/i);

    expect(within(section).getByText('forgotten')).toBeInTheDocument();
    expect(within(section).getByText('paused')).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: /review paused checks/i })).toHaveAttribute(
      'href',
      expect.stringContaining('status=disabled')
    );
  });

  it('collapses a finding when its heading is clicked', async () => {
    const { user } = await renderTab([buildCheck({ job: 'unalerted', target: 'https://a.com' })]);

    const section = await findSection(/alerting/i);
    expect(within(section).getByText('unalerted')).toBeInTheDocument();

    await user.click(within(section).getByRole('button', { expanded: true }));

    expect(within(section).queryByText('unalerted')).not.toBeInTheDocument();
  });

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

  it('reports a target covered by more than one check type', async () => {
    await renderTab([
      buildCheck({ job: 'http', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Http),
      buildCheck({ job: 'ping', target: 'grafana.com', alertSensitivity: AlertSensitivity.High }, CheckType.Ping),
    ]);

    const section = await findSection(/overlapping targets/i);

    expect(within(section).getByText(/http, ping · 2 checks/)).toBeInTheDocument();
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
      const reportInteraction = jest.fn();
      jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;

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

  describe('cost attribution labels', () => {
    const withCalNames = (names: string[]) =>
      server.use(apiRoute('getTenantCostAttributionLabels', { result: () => ({ json: { names } }) }));

    it('reports checks missing a tenant cost label', async () => {
      mockFeatureToggles({ [FeatureName.CALs]: true });
      withCalNames(['team']);

      await renderTab([
        buildCheck({ job: 'unattributed', alertSensitivity: AlertSensitivity.High, target: 'https://a.com' }),
      ]);

      const section = await findSection(/cost attribution/i);

      expect(within(section).getByRole('link', { name: /add labels/i })).toHaveAttribute(
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
