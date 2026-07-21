import { expect } from '@grafana/plugin-e2e';
import type { Locator, Page } from '@playwright/test';

import { CHECKS_TEST_ID } from '../../src/test/dataTestIds.constants';
import { HTTP_DASHBOARD_CONTROLS } from './checkDashboard/httpDashboardContract';

const PANEL_PUBLIC_UI_SETTLE_TIMEOUT_MS = 10_000;

export type CheckDashboardPanelSynchronization =
  | {
      mode: 'loading-cycle';
      trigger?: () => Promise<void> | void;
    }
  | {
      mode: 'expected-terminal';
      expected: string | RegExp | ((panel: Locator) => Locator);
    };

export async function openSeededCheckDashboard(page: Page, job: string) {
  await page.goto(`/a/grafana-synthetic-monitoring-app/checks?view=card&search=${encodeURIComponent(job)}`);

  const checkCard = page
    .getByTestId(CHECKS_TEST_ID.card)
    .filter({ has: page.getByRole('heading', { name: job, exact: true }) });

  await expect(checkCard).toHaveCount(1);
  await checkCard.getByRole('link', { name: HTTP_DASHBOARD_CONTROLS.viewDashboard }).click();
  await expect(page).toHaveURL(/\/a\/grafana-synthetic-monitoring-app\/checks\/\d+\/?(?:\?.*)?$/);
}

export function getCheckDashboardPanel(page: Page, title: string | RegExp): Locator {
  return page.getByRole('region', { name: title });
}

export async function scrollCheckDashboardPanelIntoView(page: Page, title: string | RegExp): Promise<Locator> {
  const panel = getCheckDashboardPanel(page, title);
  const viewport = page.viewportSize();

  if (viewport) {
    await page.mouse.move(Math.floor(viewport.width / 2), Math.floor(viewport.height / 2));
  }

  await expect
    .poll(
      async () => {
        const count = await panel.count();

        if (count === 0 && viewport) {
          await page.mouse.wheel(0, Math.max(Math.floor(viewport.height * 0.75), 250));
        }

        return count;
      },
      { intervals: [0, 100], timeout: 5_000 }
    )
    .toBe(1);
  await panel.scrollIntoViewIfNeeded();

  return panel;
}

function textLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function getVisibleStatTextLines(panel: Locator): Promise<string[]> {
  const chromeLocators = [
    panel.getByRole('heading'),
    panel.getByRole('button'),
    panel.getByRole('link'),
    panel.getByRole('status'),
    panel.getByRole('alert'),
  ];
  const chromeLines = new Set<string>();

  for (const chromeLocator of chromeLocators) {
    for (const text of await chromeLocator.allInnerTexts()) {
      for (const line of textLines(text)) {
        chromeLines.add(line);
      }
    }
  }

  return textLines(await panel.innerText()).filter((line) => !chromeLines.has(line));
}

async function waitForPanelPublicUiTerminal(
  panel: Locator,
  synchronization: CheckDashboardPanelSynchronization
): Promise<void> {
  if (synchronization.mode === 'expected-terminal') {
    const expected = synchronization.expected;
    const terminalLocator =
      typeof expected === 'string' || expected instanceof RegExp
        ? panel.getByText(expected, { exact: typeof expected === 'string' })
        : expected(panel);

    await expect(terminalLocator).toBeVisible({ timeout: PANEL_PUBLIC_UI_SETTLE_TIMEOUT_MS });
    return;
  }

  const loadingBar = panel.getByLabel('Panel loading bar').first();
  const loadingStarted = loadingBar.waitFor({ state: 'visible', timeout: PANEL_PUBLIC_UI_SETTLE_TIMEOUT_MS });

  if (synchronization.trigger) {
    try {
      await synchronization.trigger();
    } catch (error) {
      void loadingStarted.catch(() => undefined);
      throw error;
    }
  }

  await loadingStarted;
  await loadingBar.waitFor({ state: 'hidden', timeout: PANEL_PUBLIC_UI_SETTLE_TIMEOUT_MS });
}

export async function waitForCheckDashboardPanelToSettle(
  page: Page,
  title: string | RegExp,
  synchronization: CheckDashboardPanelSynchronization
): Promise<void> {
  const panel = await scrollCheckDashboardPanelIntoView(page, title);

  await expect(panel).toBeVisible();
  await waitForPanelPublicUiTerminal(panel, synchronization);
}

export async function expectCheckDashboardPanelToHaveNoError(
  page: Page,
  title: string | RegExp,
  synchronization: CheckDashboardPanelSynchronization
): Promise<void> {
  const panel = await scrollCheckDashboardPanelIntoView(page, title);

  await expect(panel).toBeVisible();
  await waitForPanelPublicUiTerminal(panel, synchronization);
  expect(await panel.getByRole('button', { name: 'Panel status' }).count()).toBe(0);
}

export async function readCheckDashboardStatText(
  page: Page,
  title: string | RegExp,
  synchronization: CheckDashboardPanelSynchronization
): Promise<string> {
  const panel = await scrollCheckDashboardPanelIntoView(page, title);

  await expect(panel).toBeVisible();
  await waitForPanelPublicUiTerminal(panel, synchronization);
  const panelTitle = (await panel.getByRole('heading').first().innerText()).trim();
  const visibleLines = await getVisibleStatTextLines(panel);

  if (visibleLines.length === 0) {
    throw new Error(`No visible stat value found in panel ${JSON.stringify(panelTitle)}`);
  }

  return visibleLines.join(' ');
}

export async function openCheckDashboardPanelMenu(page: Page, title: string): Promise<Locator> {
  const panel = await scrollCheckDashboardPanelIntoView(page, title);
  const menuButton = panel.getByRole('button', { name: `Menu for panel ${title}` });

  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  return menu;
}
