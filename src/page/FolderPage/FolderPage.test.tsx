import React from 'react';
import { screen } from '@testing-library/react';
import { CHECK_IN_PRODUCTION, CHECK_IN_STAGING } from 'test/fixtures/folderChecks';
import { FOLDER_DELETABLE, FOLDER_PRODUCTION } from 'test/fixtures/folders';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { FolderPage } from './FolderPage';

const FOLDER_CHECKS = [CHECK_IN_PRODUCTION, CHECK_IN_STAGING];

const renderFolderPage = (folderUid: string, checks: Check[] = FOLDER_CHECKS) => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => ({
        json: checks,
      }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({
        json: [PRIVATE_PROBE, PUBLIC_PROBE],
      }),
    })
  );

  return render(<FolderPage />, {
    route: AppRoutes.FolderDashboard,
    path: generateRoutePath(AppRoutes.FolderDashboard, { uid: folderUid }),
  });
};

describe(`FolderPage`, () => {
  beforeEach(() => {
    mockFeatureToggles({ [FeatureName.Folders]: true });
  });

  it(`renders the folder title`, async () => {
    renderFolderPage(FOLDER_PRODUCTION.uid);

    expect(await screen.findByRole(`heading`, { name: FOLDER_PRODUCTION.title })).toBeInTheDocument();
  });

  it(`lists the checks that belong to the folder`, async () => {
    renderFolderPage(FOLDER_PRODUCTION.uid);

    expect(await screen.findByText(CHECK_IN_PRODUCTION.job)).toBeInTheDocument();
  });

  it(`does not list checks from other folders`, async () => {
    renderFolderPage(FOLDER_PRODUCTION.uid);

    await screen.findByText(CHECK_IN_PRODUCTION.job);
    expect(screen.queryByText(CHECK_IN_STAGING.job)).not.toBeInTheDocument();
  });

  it(`links checks to their dashboard`, async () => {
    renderFolderPage(FOLDER_PRODUCTION.uid);

    // The check name appears as a link in both the table and the swimlane.
    const checkLinks = await screen.findAllByRole(`link`, { name: CHECK_IN_PRODUCTION.job });
    const dashboardPath = generateRoutePath(AppRoutes.CheckDashboard, { id: CHECK_IN_PRODUCTION.id! });
    expect(checkLinks.length).toBeGreaterThan(0);
    checkLinks.forEach((link) => {
      expect(link.getAttribute(`href`)).toContain(dashboardPath);
    });
  });

  it(`shows an empty state for a folder without checks`, async () => {
    renderFolderPage(FOLDER_DELETABLE.uid);

    expect(await screen.findByText(`This folder doesn't have any checks yet`)).toBeInTheDocument();
  });

  it(`shows not found for an unknown folder`, async () => {
    renderFolderPage(`not-a-real-folder-uid`);

    expect(await screen.findByText(/The folder you are looking for does not exist/)).toBeInTheDocument();
  });
});
