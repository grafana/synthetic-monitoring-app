import React from 'react';
import { screen, within } from '@testing-library/react';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_PING_CHECK } from 'test/fixtures/checks';
import { FOLDER_PRODUCTION, FOLDER_STAGING } from 'test/fixtures/folders';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { defaultFilters,matchesAllFilters } from 'page/CheckList/CheckList.utils';

import { CheckList } from './CheckList';

const CHECK_IN_PRODUCTION: Check = {
  ...BASIC_HTTP_CHECK,
  id: 100,
  job: 'Production HTTP check',
  folderUid: FOLDER_PRODUCTION.uid,
};

const CHECK_IN_STAGING: Check = {
  ...BASIC_DNS_CHECK,
  id: 101,
  job: 'Staging DNS check',
  folderUid: FOLDER_STAGING.uid,
};

const CHECK_WITHOUT_FOLDER: Check = {
  ...BASIC_PING_CHECK,
  id: 102,
  job: 'Root level ping check',
  folderUid: undefined,
};

const FOLDER_CHECKS = [CHECK_IN_PRODUCTION, CHECK_IN_STAGING, CHECK_WITHOUT_FOLDER];

describe('matchesAllFilters - folder filtering', () => {
  test('empty folders filter matches all checks', () => {
    const filters = { ...defaultFilters, folders: [] };

    expect(matchesAllFilters(CHECK_IN_PRODUCTION, filters)).toBe(true);
    expect(matchesAllFilters(CHECK_WITHOUT_FOLDER, filters)).toBe(true);
  });

  test('filtering by a specific folder matches only checks in that folder', () => {
    const filters = { ...defaultFilters, folders: [FOLDER_PRODUCTION.uid] };

    expect(matchesAllFilters(CHECK_IN_PRODUCTION, filters)).toBe(true);
    expect(matchesAllFilters(CHECK_IN_STAGING, filters)).toBe(false);
    expect(matchesAllFilters(CHECK_WITHOUT_FOLDER, filters)).toBe(false);
  });

  test('filtering by multiple folders matches checks in any of them', () => {
    const filters = { ...defaultFilters, folders: [FOLDER_PRODUCTION.uid, FOLDER_STAGING.uid] };

    expect(matchesAllFilters(CHECK_IN_PRODUCTION, filters)).toBe(true);
    expect(matchesAllFilters(CHECK_IN_STAGING, filters)).toBe(true);
    expect(matchesAllFilters(CHECK_WITHOUT_FOLDER, filters)).toBe(false);
  });

  test('filtering by default folder matches checks without folderUid', () => {
    const defaultUid = 'default-folder-uid';
    const filters = { ...defaultFilters, folders: [defaultUid] };

    expect(matchesAllFilters(CHECK_WITHOUT_FOLDER, filters, defaultUid)).toBe(true);
    expect(matchesAllFilters(CHECK_IN_PRODUCTION, filters, defaultUid)).toBe(false);
  });
});

const renderCheckList = async (checks: Check[] = FOLDER_CHECKS, searchParams = '') => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => ({ json: checks }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
    })
  );

  const path = `${generateRoutePath(AppRoutes.Checks)}?${searchParams}`;

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path,
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - Folder Filter Integration', () => {
  describe('with folders feature enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    test('folder filter appears in the additional filters modal', async () => {
      const { user } = await renderCheckList();

      const filterButton = screen.getByRole('button', { name: /additional filters/i });
      await user.click(filterButton);

      const modal = document.body.querySelector('[role="dialog"]') as HTMLElement;
      expect(within(modal).getByText('Folders')).toBeInTheDocument();
    });
  });

  describe('with folders feature disabled', () => {
    test('folder filter does not appear', async () => {
      const { user } = await renderCheckList();

      const filterButton = screen.getByRole('button', { name: /additional filters/i });
      await user.click(filterButton);

      const modal = document.body.querySelector('[role="dialog"]') as HTMLElement;
      expect(within(modal).queryByText('Folders')).not.toBeInTheDocument();
    });
  });
});
