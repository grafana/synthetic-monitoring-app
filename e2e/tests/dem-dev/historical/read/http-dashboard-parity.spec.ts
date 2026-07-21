import type { Locator, Page } from '@playwright/test';
import type { Components } from '@grafana/plugin-e2e';

import { SM_FEATURE_NAMES } from '../../../../../src/services/featureFlags.constants';
import { SCENES_TEST_ID } from '../../../../../src/test/dataTestIds.constants';
import reviewedDashboardValues from '../../../../fixtures/http-dashboard-parity.v1.json';
import {
  HTTP_DASHBOARD_CONTROLS,
  HTTP_DASHBOARD_LEGENDS,
  HTTP_DASHBOARD_PANEL_MENU_ITEMS,
  HTTP_DASHBOARD_PANELS,
  HTTP_DASHBOARD_PROBE_OPTIONS,
  HTTP_DASHBOARD_TIMEPOINT,
} from '../../../../support/checkDashboard/httpDashboardContract';
import {
  displayedCertificateDurationToSeconds,
  displayedDurationToMilliseconds,
  displayedFrequencyToMilliseconds,
  displayedPercentToRatio,
} from '../../../../support/checkDashboard/httpDashboardValues';
import {
  openCheckDashboardPanelMenu,
  openSeededCheckDashboard,
  readCheckDashboardStatText,
  scrollCheckDashboardPanelIntoView,
  waitForCheckDashboardPanelToSettle,
} from '../../../../support/checks';
import { smFeatureProfile } from '../../../../support/dem-dev/featureFlags';
import { expect, test } from '../../../../support/dem-dev/fixtures';
import {
  formatGrafanaUtcInput,
  getDashboardTimeRange,
  getExpectedTimepointCount,
  requireHttpDashboardManifest,
  type HttpDashboardManifest,
} from '../../../../support/dem-dev/httpDashboardManifest';

// The dashboard's Prometheus range/rate reduction differs slightly from the
// arithmetic mean in the raw manifest. The exact reviewed text is the parity
// oracle; this narrow bound still proves it belongs to the same raw dataset.
const AVERAGE_LATENCY_MANIFEST_SANITY_BOUND = 0.03;
const REFRESH_IDLE_ICON_TEST_ID = 'icon-sync';
const REFRESH_LOADING_ICON_TEST_ID = 'icon-spinner';

export interface HttpDashboardAssertionContext {
  page: Page;
  components: Components;
  manifest: HttpDashboardManifest;
  range: ReturnType<typeof getDashboardTimeRange>;
}

export async function assertEntryAndChrome({
  page,
  components,
  manifest,
}: HttpDashboardAssertionContext): Promise<void> {
  const main = page.getByRole('main');
  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumbs' });

  await expect(main.getByRole('heading', { level: 1, name: manifest.job, exact: true })).toBeVisible();
  await expect(breadcrumbs.getByRole('listitem').filter({ hasText: manifest.job })).toBeVisible();
  await expect(page.getByRole('link', { name: HTTP_DASHBOARD_CONTROLS.editCheck, exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: HTTP_DASHBOARD_CONTROLS.probe, exact: true })).toBeVisible();

  const { RefreshPicker, TimePicker } = components.timeRangePicker.ctx.selectors.components;
  await expect(components.timeRangePicker.getByGrafanaSelector(TimePicker.openButton)).toBeVisible();
  await expect(components.timeRangePicker.getByGrafanaSelector(RefreshPicker.runButtonV2)).toBeVisible();
}

export async function assertFixedRange({
  page,
  components,
  manifest,
  range,
}: HttpDashboardAssertionContext): Promise<void> {
  const from = formatGrafanaUtcInput(range.from);
  const to = formatGrafanaUtcInput(range.to);

  await selectCoordinatedUniversalTime(page, components);
  await components.timeRangePicker.set({ from, to });
  await waitForCheckDashboardPanelToSettle(page, HTTP_DASHBOARD_PANELS.reachability, {
    mode: 'expected-terminal',
    expected: expectedPercentText(expectedRenderedReachability(manifest)),
  });

  const { TimePicker } = components.timeRangePicker.ctx.selectors.components;
  const openButton = components.timeRangePicker.getByGrafanaSelector(TimePicker.openButton);
  await expect(openButton).toBeVisible();
  await openButton.click();

  await expect(components.timeRangePicker.getByGrafanaSelector(TimePicker.fromField)).toHaveValue(from);
  await expect(components.timeRangePicker.getByGrafanaSelector(TimePicker.toField)).toHaveValue(to);
  await expectLegacyUtcFallback(page);
  await page.keyboard.press('Escape');
}

export async function assertHeadlineMetrics({ page, manifest, range }: HttpDashboardAssertionContext): Promise<void> {
  const uptime = await readStat(page, HTTP_DASHBOARD_PANELS.uptime, expectedPercentText(manifest.aggregate.uptime));
  expectRatioAtDisplayedPrecision(uptime, manifest.aggregate.uptime);

  const expectedReachability = expectedRenderedReachability(manifest);
  const reachability = await readStat(
    page,
    HTTP_DASHBOARD_PANELS.reachability,
    expectedPercentText(expectedReachability)
  );
  expectRatioAtDisplayedPrecision(reachability, expectedReachability);

  const frequency = await readStat(page, HTTP_DASHBOARD_PANELS.frequency, expectedFrequencyText(manifest.frequency_ms));
  expect(displayedFrequencyToMilliseconds(frequency)).toBe(manifest.frequency_ms);

  const expectedSslExpirySeconds = manifest.aggregate.ssl_earliest_cert_expiry - Date.parse(range.to) / 1_000;
  const sslExpiry = await readStat(
    page,
    HTTP_DASHBOARD_PANELS.sslExpiry,
    expectedCertificateDurationText(expectedSslExpirySeconds)
  );
  expectDurationAtDisplayedPrecision(sslExpiry, expectedSslExpirySeconds);

  const reviewedAverageLatency = getReviewedAverageLatency(manifest);
  const averageLatency = await readStat(page, HTTP_DASHBOARD_PANELS.averageLatency, reviewedAverageLatency);
  const renderedAverageLatencyMs = displayedDurationToMilliseconds(averageLatency);
  const rawAverageLatencyMs = manifest.aggregate.latency_mean_ms;

  expect(averageLatency).toBe(reviewedAverageLatency);
  expect(renderedAverageLatencyMs).toBeGreaterThanOrEqual(
    rawAverageLatencyMs * (1 - AVERAGE_LATENCY_MANIFEST_SANITY_BOUND)
  );
  expect(renderedAverageLatencyMs).toBeLessThanOrEqual(
    rawAverageLatencyMs * (1 + AVERAGE_LATENCY_MANIFEST_SANITY_BOUND)
  );
}

export async function assertProbeSelection({ page, manifest }: HttpDashboardAssertionContext): Promise<void> {
  const singapore = manifest.probes.singapore;

  if (!singapore) {
    throw new Error('http-dashboard-parity manifest must include the singapore probe');
  }

  const probeControl = page.getByRole('combobox', { name: HTTP_DASHBOARD_CONTROLS.probe, exact: true });
  await selectSingleProbe(page, probeControl, 'singapore');

  const expectedSingaporeReachability = expectedRenderedProbeReachability(singapore);
  const singaporeReachability = await readStat(
    page,
    HTTP_DASHBOARD_PANELS.reachability,
    expectedPercentText(expectedSingaporeReachability)
  );
  expectRatioAtDisplayedPrecision(singaporeReachability, expectedSingaporeReachability);

  await selectSingleProbe(page, probeControl, HTTP_DASHBOARD_PROBE_OPTIONS.all);

  const expectedAggregateReachability = expectedRenderedReachability(manifest);
  const aggregateReachability = await readStat(
    page,
    HTTP_DASHBOARD_PANELS.reachability,
    expectedPercentText(expectedAggregateReachability)
  );
  expectRatioAtDisplayedPrecision(aggregateReachability, expectedAggregateReachability);
}

export async function assertFailureAndLatencyPanels({ page, manifest }: HttpDashboardAssertionContext): Promise<void> {
  const probeLegends = Object.keys(manifest.probes);

  await assertDataPanel(
    page,
    HTTP_DASHBOARD_PANELS.errorRateByProbe,
    (panel) => panel.getByRole('application', { name: HTTP_DASHBOARD_LEGENDS.navigableMap, exact: true }),
    []
  );
  await assertDataPanel(
    page,
    HTTP_DASHBOARD_PANELS.errorRate,
    (panel) => panel.getByText('singapore', { exact: true }),
    probeLegends
  );
  await assertDataPanel(
    page,
    HTTP_DASHBOARD_PANELS.responseLatencyByPhase,
    (panel) => panel.getByRole('button', { name: 'processing', exact: true }),
    [...HTTP_DASHBOARD_LEGENDS.httpPhases]
  );
  await assertDataPanel(
    page,
    HTTP_DASHBOARD_PANELS.responseLatencyByProbe,
    (panel) => panel.getByRole('button', { name: 'singapore', exact: true }),
    probeLegends
  );
}

export async function assertTimepointAndLogs({ page, manifest }: HttpDashboardAssertionContext): Promise<void> {
  const timepointList = page.getByTestId(SCENES_TEST_ID.timepoint.list);
  const viewer = page.getByTestId(SCENES_TEST_ID.timepoint.viewer);
  await expect(timepointList).toBeVisible();
  await expect(viewer).toBeVisible();

  const bars = page.locator(`[data-testid^="${SCENES_TEST_ID.timepoint.listEntryBar}-"]`);
  await expect(bars).toHaveCount(getExpectedTimepointCount(manifest));

  const uptime = page.getByRole('radio', { name: HTTP_DASHBOARD_CONTROLS.uptimeView, exact: true });
  const reachability = page.getByRole('radio', { name: HTTP_DASHBOARD_CONTROLS.reachabilityView, exact: true });
  await expect(uptime).toBeChecked();
  await reachability.click();
  await expect(reachability).toBeChecked();
  await uptime.click();
  await expect(uptime).toBeChecked();

  const failures = page.locator(`[data-testid^="${SCENES_TEST_ID.timepoint.listEntryBar}-"][data-status="failure"]`);
  await expect.poll(() => failures.count()).toBeGreaterThan(0);
  await failures.first().click();

  await expect(viewer).toContainText(HTTP_DASHBOARD_TIMEPOINT.checkFailed);
  const expectedProbe = Object.keys(manifest.probes).sort((left, right) => left.localeCompare(right))[0];
  const selectedProbe = viewer.getByRole('tab', { name: expectedProbe, exact: true });
  await expect(selectedProbe).toHaveAttribute('aria-selected', 'true');
  await expect(viewer).toContainText(expectedConfiguredFrequency(manifest.frequency_ms));
  await expect(viewer).toContainText(HTTP_DASHBOARD_TIMEPOINT.statusCode);
}

export async function assertPanelActions({ page, manifest }: HttpDashboardAssertionContext): Promise<void> {
  const dashboardUrl = page.url();
  const origin = new URL(dashboardUrl).origin;
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await page.evaluate(() => navigator.clipboard.writeText(''));

  const copyMenu = await openCheckDashboardPanelMenu(page, HTTP_DASHBOARD_PANELS.errorRateByProbe);
  const copyJson = copyMenu.getByRole('menuitem', {
    name: HTTP_DASHBOARD_PANEL_MENU_ITEMS.copyJson,
    exact: true,
  });
  await expect(copyJson).toBeVisible();
  await copyJson.click();

  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).not.toBe('');
  const copiedPanel = parseCopiedPanelJson(await page.evaluate(() => navigator.clipboard.readText()));

  expect(copiedPanel.type.trim()).not.toBe('');
  expect(copiedPanel.datasource.uid.trim()).not.toBe('');
  expect(copiedPanel.targets.length).toBeGreaterThan(0);

  const expressions = copiedPanel.targets
    .filter(isRecord)
    .map((target) => target.expr)
    .filter((expression): expression is string => typeof expression === 'string' && expression.length > 0);
  expect(expressions.length).toBeGreaterThan(0);
  expect(
    expressions.some(
      (expression) =>
        expression.includes(`job="${manifest.job}"`) &&
        expressionMatchesAllProbes(expression, Object.keys(manifest.probes))
    )
  ).toBe(true);

  const exploreMenu = await openCheckDashboardPanelMenu(page, HTTP_DASHBOARD_PANELS.errorRateByProbe);
  const explore = exploreMenu.getByRole('menuitem', {
    name: HTTP_DASHBOARD_PANEL_MENU_ITEMS.explore,
    exact: true,
  });
  await expect(explore).toBeVisible();
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/explore' && Boolean(url.searchParams.get('left'))),
    explore.click(),
  ]);

  const exploreUrl = new URL(page.url());
  expect(exploreUrl.pathname).toBe('/explore');
  expect(exploreUrl.searchParams.get('left')).not.toBeNull();
  expect(exploreUrl.searchParams.get('left')).not.toBe('');

  await page.goBack();
  await expect(page).toHaveURL(dashboardUrl);
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1, name: manifest.job, exact: true })
  ).toBeVisible();
}

export async function assertRefreshStability({
  page,
  components,
  manifest,
  range,
}: HttpDashboardAssertionContext): Promise<void> {
  const { RefreshPicker, TimePicker } = components.timeRangePicker.ctx.selectors.components;
  const refresh = components.timeRangePicker.getByGrafanaSelector(RefreshPicker.runButtonV2);
  await expect(refresh).toBeVisible();
  await expect(refresh).toBeEnabled();
  await expect(refresh.getByTestId(REFRESH_IDLE_ICON_TEST_ID)).toBeVisible();
  await Promise.all([refresh.getByTestId(REFRESH_LOADING_ICON_TEST_ID).waitFor({ state: 'visible' }), refresh.click()]);
  await expect(refresh.getByTestId(REFRESH_IDLE_ICON_TEST_ID)).toBeVisible();
  await expect(refresh.getByTestId(REFRESH_LOADING_ICON_TEST_ID)).toHaveCount(0);

  const from = formatGrafanaUtcInput(range.from);
  const to = formatGrafanaUtcInput(range.to);
  await components.timeRangePicker.getByGrafanaSelector(TimePicker.openButton).click();
  await expect(components.timeRangePicker.getByGrafanaSelector(TimePicker.fromField)).toHaveValue(from);
  await expect(components.timeRangePicker.getByGrafanaSelector(TimePicker.toField)).toHaveValue(to);
  await page.keyboard.press('Escape');

  const probeControl = page.getByRole('combobox', { name: HTTP_DASHBOARD_CONTROLS.probe, exact: true });
  await probeControl.click();
  const allProbes = page.getByRole('option', { name: HTTP_DASHBOARD_PROBE_OPTIONS.all, exact: true });
  await expect(allProbes).toBeVisible();
  await expect(allProbes).toHaveAttribute('aria-selected', 'true');
  await probeControl.press('Escape');

  await assertHeadlineMetrics({ page, components, manifest, range });
  await assertFailureAndLatencyPanels({ page, components, manifest, range });
}

test.use(smFeatureProfile({ [SM_FEATURE_NAMES.TimepointExplorer]: true }));

test('preserves the legacy HTTP dashboard entry, fixed range, and headline metrics', async ({
  page,
  components,
  scenarioManifest,
}) => {
  const manifest = requireHttpDashboardManifest(scenarioManifest);
  const context: HttpDashboardAssertionContext = {
    page,
    components,
    manifest,
    range: getDashboardTimeRange(manifest),
  };

  await openSeededCheckDashboard(page, manifest.job);

  await test.step('entry and dashboard chrome', async () => assertEntryAndChrome(context));
  await test.step('one-execution padded absolute range', async () => assertFixedRange(context));
  await test.step('headline metrics', async () => assertHeadlineMetrics(context));
  await test.step('probe selection and restoration', async () => assertProbeSelection(context));
  await test.step('failure and latency panels', async () => assertFailureAndLatencyPanels(context));
  await test.step('Timepoint Explorer and rendered logs', async () => assertTimepointAndLogs(context));
  await test.step('panel actions', async () => assertPanelActions(context));
  await test.step('refresh stability', async () => assertRefreshStability(context));
});

async function readStat(page: Page, title: string, terminal: string): Promise<string> {
  return readCheckDashboardStatText(page, title, {
    mode: 'expected-terminal',
    expected: terminal,
  });
}

function expectRatioAtDisplayedPrecision(displayed: string, expected: number): void {
  const resolution = displayedNumericResolution(displayed) / 100;
  expect(Math.abs(displayedPercentToRatio(displayed) - expected)).toBeLessThanOrEqual(resolution / 2 + Number.EPSILON);
}

function expectDurationAtDisplayedPrecision(displayed: string, expectedSeconds: number): void {
  const unit = displayed.trim().match(/(ns|µs|ms|s|min|hours?|days?|weeks?|years?)$/i)?.[1];

  if (!unit) {
    throw new Error(`Unable to determine displayed duration precision: ${JSON.stringify(displayed)}`);
  }

  const resolutionSeconds = displayedCertificateDurationToSeconds(`${displayedNumericResolution(displayed)} ${unit}`);
  expect(Math.abs(displayedCertificateDurationToSeconds(displayed) - expectedSeconds)).toBeLessThanOrEqual(
    resolutionSeconds / 2 + Number.EPSILON
  );
}

function displayedNumericResolution(displayed: string): number {
  const numberText = displayed.trim().match(/[+-]?(?:\d+(?:,\d{3})*(?:\.\d+)?|\.\d+)/)?.[0];

  if (!numberText) {
    throw new Error(`Unable to determine displayed numeric precision: ${JSON.stringify(displayed)}`);
  }

  const decimalPlaces = numberText.split('.')[1]?.length ?? 0;
  return 10 ** -decimalPlaces;
}

function expectedRenderedReachability(manifest: HttpDashboardManifest): number {
  let rawReachableExecutions = 0;
  let rateWindowReachableExecutions = 0;
  let rateWindowExecutionIntervals = 0;

  for (const probe of Object.values(manifest.probes)) {
    const reachableExecutions = Math.round(probe.reachability * probe.executions);
    rawReachableExecutions += reachableExecutions;

    // Reachability is rendered from counter rates: N samples contain N - 1
    // counter deltas. This fixed scenario begins healthy on every probe, so
    // the initial healthy sample is the baseline rather than a rate interval.
    rateWindowReachableExecutions += reachableExecutions - 1;
    rateWindowExecutionIntervals += probe.executions - 1;
  }

  const rawReachability = rawReachableExecutions / manifest.aggregate.executions;
  expect(rawReachability).toBeCloseTo(manifest.aggregate.reachability, 12);

  return rateWindowReachableExecutions / rateWindowExecutionIntervals;
}

function expectedRenderedProbeReachability(probe: HttpDashboardManifest['probes'][string]): number {
  if (probe.executions <= 1) {
    throw new Error(`Counter-rate reachability requires at least two executions, got ${probe.executions}`);
  }

  const reachableExecutions = Math.round(probe.reachability * probe.executions);

  // The first healthy counter sample establishes the rate baseline, so N
  // samples contribute N - 1 intervals and one fewer reachable delta.
  return (reachableExecutions - 1) / (probe.executions - 1);
}

async function selectSingleProbe(page: Page, probeControl: Locator, optionLabel: string): Promise<void> {
  await probeControl.click();
  await probeControl.press('Backspace');

  const option = page.getByRole('option', { name: optionLabel, exact: true });
  await expect(option).toBeVisible();
  await option.click();
  await expect(option).toHaveAttribute('aria-selected', 'true');
  await probeControl.press('Escape');
}

async function assertDataPanel(
  page: Page,
  title: string | RegExp,
  terminal: (panel: Locator) => Locator,
  expectedLegends: string[]
): Promise<void> {
  const panel = await scrollCheckDashboardPanelIntoView(page, title);
  await waitForCheckDashboardPanelToSettle(page, title, { mode: 'expected-terminal', expected: terminal });

  for (const legend of expectedLegends) {
    await expect(panel.getByText(legend, { exact: true })).toBeVisible();
  }
  await expect(panel.getByText('N/A', { exact: true })).toHaveCount(0);
  expect(await panel.getByRole('button', { name: 'Panel status' }).count()).toBe(0);
}

function expectedConfiguredFrequency(frequencyMs: number): string {
  const minutes = frequencyMs / 60_000;
  if (Number.isInteger(minutes) && minutes > 0) {
    return `${HTTP_DASHBOARD_TIMEPOINT.configuredFrequency} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  const seconds = frequencyMs / 1_000;
  if (Number.isInteger(seconds) && seconds > 0) {
    return `${HTTP_DASHBOARD_TIMEPOINT.configuredFrequency} ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }

  throw new Error(`Timepoint frequency must be a positive whole second, got ${frequencyMs}ms`);
}

function getReviewedAverageLatency(manifest: HttpDashboardManifest): string {
  const identity = `${manifest.scenario}:dsl-${manifest.dsl_version}:schema-${manifest.schema_version}`;
  const baseline = reviewedDashboardValues[identity as keyof typeof reviewedDashboardValues];

  if (!baseline) {
    throw new Error(`No reviewed HTTP dashboard values for ${identity}`);
  }

  return baseline.average_latency;
}

async function selectCoordinatedUniversalTime(page: Page, components: Components): Promise<void> {
  const { TimePicker, TimeZonePicker } = components.timeRangePicker.ctx.selectors.components;

  await components.timeRangePicker.getByGrafanaSelector(TimePicker.openButton).click();
  await components.timeRangePicker.getByGrafanaSelector(TimeZonePicker.changeTimeSettingsButton).click();

  const timeZonePicker = components.timeRangePicker.getByGrafanaSelector(TimeZonePicker.containerV2);
  await timeZonePicker.click();

  const utcOption = page
    .getByRole('option')
    .filter({ has: page.getByText('Coordinated Universal Time', { exact: true }) });
  await expect(utcOption).toHaveCount(1);
  await expect(utcOption).toBeVisible();
  await utcOption.click();
  await expect(timeZonePicker).toHaveCount(0);
  await expectLegacyUtcFallback(page);
  await page.keyboard.press('Escape');
}

async function expectLegacyUtcFallback(page: Page): Promise<void> {
  const renderedTimeZone = page.getByRole('region', { name: 'Time zone selection' });

  // The legacy Scenes wrapper deliberately ignores the timezone callback.
  // Browser Time is nevertheless UTC in this Playwright project, and the
  // rendered UTC+00:00 offset proves the interpretation used for the inputs.
  await expect(renderedTimeZone).toContainText('Browser Time');
  await expect(renderedTimeZone).toContainText('UTC+00:00');
}

function expectedPercentText(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

function expectedFrequencyText(frequencyMs: number): string {
  const minutes = frequencyMs / 60_000;

  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error(`The reviewed HTTP dashboard frequency is not an exact minute count: ${frequencyMs}`);
  }

  return `${minutes} min`;
}

function expectedCertificateDurationText(seconds: number): string {
  const years = seconds / displayedCertificateDurationToSeconds('1 year');
  return `${years.toFixed(2)} years`;
}

interface CopiedPanelJson {
  type: string;
  datasource: { uid: string };
  targets: unknown[];
}

function parseCopiedPanelJson(value: string): CopiedPanelJson {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error('Copy JSON did not write valid JSON to the browser clipboard', { cause: error });
  }

  if (
    !isRecord(parsed) ||
    typeof parsed.type !== 'string' ||
    !isRecord(parsed.datasource) ||
    typeof parsed.datasource.uid !== 'string' ||
    !Array.isArray(parsed.targets)
  ) {
    throw new Error('Copy JSON did not write the expected public panel structure');
  }

  return {
    type: parsed.type,
    datasource: { uid: parsed.datasource.uid },
    targets: parsed.targets,
  };
}

function expressionMatchesAllProbes(expression: string, probes: string[]): boolean {
  const matchers = [...expression.matchAll(/probe=~"([^"]+)"/g)].map((match) => match[1]);

  return (
    matchers.length > 0 &&
    probes.every((probe) =>
      matchers.some((matcher) => matcher === '.*' || matcher.split('|').some((value) => value === probe))
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
