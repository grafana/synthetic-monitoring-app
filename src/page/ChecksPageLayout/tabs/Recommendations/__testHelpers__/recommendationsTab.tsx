import React from 'react';
import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';
import { DB } from 'test/db';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { testUsesCombobox } from 'test/utils';

import { RecommendationCategoryId } from '../Recommendations.types';
import { AlertSensitivity, Check, CheckType } from 'types';

import { RecommendationsTab } from '../RecommendationsTab';

export const ONE_MINUTE = 60 * 1000;

export function buildCheck(overrides: Partial<Check>, type = CheckType.Http): Check {
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

export function renderTab(checks: Check[], options?: RenderOptions) {
  server.use(apiRoute('listChecks', { result: () => ({ json: checks }) }));

  return render(<RecommendationsTab />, options);
}

/** Lands straight on one category, the way the rail or a `?category=` link would. */
export function renderCategory(checks: Check[], category: RecommendationCategoryId, options?: RenderOptions) {
  return renderTab(checks, { ...options, path: `checks/recommendations?category=${category}` });
}

// A solo finding's heading is its summary ("1 of 2 checks have no alerts"); siblings use their names.
export async function findSection(name: RegExp) {
  const heading = await screen.findByRole('heading', { name });

  return heading.closest(`[data-testid="${RECOMMENDATIONS_TEST_ID.section}"]`) as HTMLElement;
}

export const rail = () => screen.getByRole('navigation', { name: 'Recommendation categories' });

/** Picks from the Labels or Folders search. Its menu is labelled by the group too, so it is found by role. */
export async function pickFilter(user: UserEvent, group: 'Labels' | 'Folders', option: string) {
  testUsesCombobox();
  await user.click(await screen.findByRole('combobox', { name: group }));
  await user.click(await screen.findByRole('option', { name: option }));
}

/** Which rail item is current, by its visible text (the check count is part of the button). */
export function activeRailItem() {
  return within(rail())
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-current') === 'page')?.textContent;
}
