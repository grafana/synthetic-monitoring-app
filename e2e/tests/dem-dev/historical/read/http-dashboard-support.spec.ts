import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

import {
  type CheckDashboardPanelSynchronization,
  expectCheckDashboardPanelToHaveNoError,
  getCheckDashboardPanel,
  openCheckDashboardPanelMenu,
  readCheckDashboardStatText,
  scrollCheckDashboardPanelIntoView,
  waitForCheckDashboardPanelToSettle,
} from '../../../../support/checks';
import {
  HTTP_DASHBOARD_CONTROLS,
  HTTP_DASHBOARD_PANEL_MENU_ITEMS,
  HTTP_DASHBOARD_PANELS,
} from '../../../../support/checkDashboard/httpDashboardContract';
import {
  displayedCertificateDurationToSeconds,
  displayedDurationToMilliseconds,
  displayedFrequencyToMilliseconds,
  displayedPercentToRatio,
} from '../../../../support/checkDashboard/httpDashboardValues';

test('defines the HTTP dashboard panel, control, and menu vocabulary once', () => {
  expect(HTTP_DASHBOARD_PANELS).toEqual({
    uptime: 'Uptime',
    reachability: 'Reachability',
    averageLatency: 'Average latency',
    sslExpiry: 'SSL Expiry',
    frequency: 'Frequency',
    errorRateByProbe: 'Error rate by probe',
    errorRate: /^Error Rate : /,
    responseLatencyByPhase: /^Response latency by phase: /,
    responseLatencyByProbe: 'Response latency by probe',
    logs: /^Logs for checks: /,
  });
  expect(HTTP_DASHBOARD_CONTROLS).toEqual({
    editCheck: 'Edit check',
    probe: 'probe',
    uptimeView: 'Uptime',
    reachabilityView: 'Reachability',
    viewDashboard: 'View dashboard',
  });
  expect(HTTP_DASHBOARD_PANEL_MENU_ITEMS).toEqual({ copyJson: 'Copy JSON', explore: 'Explore' });
});

test.describe('displayed dashboard values', () => {
  test('normalizes a displayed percent to a ratio', () => {
    expect(displayedPercentToRatio('99.5%')).toBeCloseTo(0.995);
    expect(displayedPercentToRatio(' 100 % ')).toBe(1);
  });

  test('normalizes displayed durations to milliseconds', () => {
    expect(displayedDurationToMilliseconds('125 ms')).toBe(125);
    expect(displayedDurationToMilliseconds('1.5 s')).toBe(1_500);
    expect(displayedDurationToMilliseconds('2 min')).toBe(120_000);
    expect(displayedDurationToMilliseconds('1 hour')).toBe(3_600_000);
    expect(displayedDurationToMilliseconds('1 year')).toBe(31_536_000_000);
  });

  test('normalizes a displayed frequency to milliseconds', () => {
    expect(displayedFrequencyToMilliseconds('1 min')).toBe(60_000);
    expect(displayedFrequencyToMilliseconds('2.5 s')).toBe(2_500);
    expect(displayedFrequencyToMilliseconds('1 year')).toBe(31_536_000_000);
  });

  test('normalizes a displayed certificate duration to seconds', () => {
    expect(displayedCertificateDurationToSeconds('1 ns')).toBe(0.000_000_001);
    expect(displayedCertificateDurationToSeconds('2 µs')).toBe(0.000_002);
    expect(displayedCertificateDurationToSeconds('3 ms')).toBe(0.003);
    expect(displayedCertificateDurationToSeconds('2 hours')).toBe(7_200);
    expect(displayedCertificateDurationToSeconds('3 days')).toBe(259_200);
    expect(displayedCertificateDurationToSeconds('1.5 weeks')).toBe(907_200);
    expect(displayedCertificateDurationToSeconds('1 year')).toBe(31_556_900);
  });

  test('normalizes expired certificate durations with ASCII and Unicode minus signs', () => {
    expect(displayedCertificateDurationToSeconds('-2 days')).toBe(-172_800);
    expect(displayedCertificateDurationToSeconds('−2 days')).toBe(-172_800);
  });

  test('rejects unavailable and unknown displayed values', () => {
    const parsers = {
      displayedPercentToRatio,
      displayedDurationToMilliseconds,
      displayedFrequencyToMilliseconds,
      displayedCertificateDurationToSeconds,
    };

    for (const [name, parser] of Object.entries(parsers)) {
      expect(parser, name).toBeDefined();
      expect(() => parser('N/A')).toThrow();
      expect(() => parser('12 fortnights')).toThrow();
    }

    expect(() => displayedDurationToMilliseconds('1 ns')).toThrow();
    expect(() => displayedDurationToMilliseconds('1 µs')).toThrow();
    expect(() => displayedFrequencyToMilliseconds('1 ns')).toThrow();
    expect(() => displayedFrequencyToMilliseconds('1 µs')).toThrow();
  });
});

test('locates, scrolls, settles, and reads only stat value text through public UI', async ({ page }) => {
  await page.setContent(`
    <main>
      <div style="height: 2000px">Spacer</div>
      <section aria-labelledby="uptime-title" tabindex="0">
        <h2 id="uptime-title">Uptime</h2>
        <button aria-label="Menu for panel Uptime">Panel menu chrome</button>
        <div role="status">Updated recently</div>
        <div>99.5%</div>
      </section>
    </main>
  `);

  const panel = getCheckDashboardPanel(page, 'Uptime');
  await expect(panel).toHaveCount(1);
  await scrollCheckDashboardPanelIntoView(page, 'Uptime');
  await expect(panel).toBeInViewport();

  const synchronization = { mode: 'expected-terminal', expected: '99.5%' } as const;

  await waitForCheckDashboardPanelToSettle(page, 'Uptime', synchronization);
  await expectCheckDashboardPanelToHaveNoError(page, 'Uptime', synchronization);
  await expect(readCheckDashboardStatText(page, 'Uptime', synchronization)).resolves.toBe('99.5%');
});

test('waits longer than the former quiet window for a loading cycle before reading a fresh stat', async ({ page }) => {
  await page.setContent(`
    <section aria-labelledby="latency-title" tabindex="0">
      <h2 id="latency-title">Average latency</h2>
      <div>stale value</div>
    </section>
  `);

  await page.getByText('stale value', { exact: true }).evaluate((value) => {
    const panel = value.parentElement;
    const loadingBar = document.createElement('div');
    loadingBar.setAttribute('aria-label', 'Panel loading bar');
    loadingBar.textContent = 'Loading';

    window.setTimeout(() => panel?.append(loadingBar), 650);
    window.setTimeout(() => {
      value.textContent = '125 ms';
      loadingBar.remove();
    }, 1_650);
  });

  await expect(readCheckDashboardStatText(page, 'Average latency', { mode: 'loading-cycle' })).resolves.toBe('125 ms');
});

test('waits longer than the former quiet window before checking a delayed panel error', async ({ page }) => {
  await page.setContent(`
    <section aria-labelledby="reachability-title" tabindex="0">
      <h2 id="reachability-title">Reachability</h2>
      <div>100%</div>
    </section>
  `);

  await page.getByText('100%', { exact: true }).evaluate((value) => {
    const panel = value.parentElement;
    const loadingBar = document.createElement('div');
    loadingBar.setAttribute('aria-label', 'Panel loading bar');
    loadingBar.textContent = 'Loading';

    window.setTimeout(() => panel?.append(loadingBar), 650);
    window.setTimeout(() => {
      const status = document.createElement('button');
      status.setAttribute('aria-label', 'Panel status');
      panel?.append(status);
      loadingBar.remove();
    }, 1_650);
  });

  const panelError = await expectCheckDashboardPanelToHaveNoError(page, 'Reachability', {
    mode: 'loading-cycle',
  }).catch((error: unknown) => error);

  expect(panelError).toBeDefined();
  expect((panelError as Error).name).not.toBe('TimeoutError');
  await expect(
    getCheckDashboardPanel(page, 'Reachability').getByRole('button', { name: 'Panel status' })
  ).toBeVisible();
});

test('starts observing the required loading cycle before invoking its trigger', async ({ page }) => {
  await page.setContent(`
    <button onclick="
      const panel = this.nextElementSibling;
      const value = panel.lastElementChild;
      const loadingBar = document.createElement('div');
      loadingBar.setAttribute('aria-label', 'Panel loading bar');
      loadingBar.textContent = 'Loading';
      panel.append(loadingBar);
      window.setTimeout(() => {
        value.textContent = '250 ms';
        loadingBar.remove();
      }, 50);
    ">Refresh dashboard</button>
    <section aria-labelledby="trigger-title" tabindex="0">
      <h2 id="trigger-title">Average latency</h2>
      <div>stale value</div>
    </section>
  `);

  await expect(
    readCheckDashboardStatText(page, 'Average latency', {
      mode: 'loading-cycle',
      trigger: () => page.getByRole('button', { name: 'Refresh dashboard' }).click(),
    })
  ).resolves.toBe('250 ms');
});

test('requires expected terminal locators to be derived from their target panel', async ({ page }) => {
  await page.setContent(`
    <div>Fresh terminal value</div>
    <section aria-labelledby="frequency-title" tabindex="0">
      <h2 id="frequency-title">Frequency</h2>
      <div>stale panel value</div>
    </section>
  `);

  const pageLevelDecoy = page.getByText('Fresh terminal value', { exact: true });
  const targetTerminal = (panel: Locator) => panel.getByText('Fresh terminal value', { exact: true });
  const rejectedSynchronization: CheckDashboardPanelSynchronization = {
    mode: 'expected-terminal',
    // @ts-expect-error Expected terminal locators must derive from the target panel.
    expected: pageLevelDecoy,
  };

  expect(rejectedSynchronization).toBeDefined();

  await page.getByText('stale panel value', { exact: true }).evaluate((value) => {
    window.setTimeout(() => {
      value.textContent = 'Fresh terminal value';
    }, 650);
  });

  await expect(
    readCheckDashboardStatText(page, 'Frequency', { mode: 'expected-terminal', expected: targetTerminal })
  ).resolves.toBe('Fresh terminal value');
});

test('scrolls until a below-fold lazy panel mounts', async ({ page }) => {
  test.setTimeout(5_000);

  await page.setContent(`
    <main><div style="height: 2000px">Dashboard panels above the fold</div></main>
    <script>
      let mounted = false;
      window.addEventListener('scroll', () => {
        if (window.scrollY < 400 || mounted) {
          return;
        }
        mounted = true;

        const title = document.createElement('h2');
        title.id = 'lazy-panel-title';
        title.textContent = 'Response latency by probe';

        const panel = document.createElement('section');
        panel.setAttribute('aria-labelledby', title.id);
        panel.tabIndex = 0;
        panel.append(title);
        document.body.append(panel);
      });
    </script>
  `);

  const panel = await scrollCheckDashboardPanelIntoView(page, 'Response latency by probe');
  await expect(panel).toBeInViewport();
});

test('supports interpolated panel titles and opens the public panel menu', async ({ page }) => {
  await page.setContent(`
    <section aria-labelledby="logs-title" tabindex="0">
      <h2 id="logs-title">Logs for checks: parity-job</h2>
      <button aria-label="Menu for panel Logs for checks: parity-job" onclick="this.parentElement.nextElementSibling.hidden = false"></button>
    </section>
    <div role="menu" hidden><button role="menuitem">Explore</button></div>
  `);

  await expect(getCheckDashboardPanel(page, /^Logs for checks: /)).toHaveCount(1);
  const menu = await openCheckDashboardPanelMenu(page, 'Logs for checks: parity-job');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Explore' })).toBeVisible();
});
