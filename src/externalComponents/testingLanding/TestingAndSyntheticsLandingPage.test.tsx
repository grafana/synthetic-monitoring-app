import React from 'react';
import { type NavModelItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { screen, within } from '@testing-library/react';
import { NAV_AGENTIC_K6, NAV_BOTH_PLUGINS, NAV_K6_ONLY, NAV_SM_ONLY } from 'test/fixtures/testingSyntheticsNav';
import { render } from 'test/render';

import { TestingAndSyntheticsLandingPage } from './TestingAndSyntheticsLandingPage';
import { AGENTIC_URLS, K6_URLS, SM_URLS } from './TestingAndSyntheticsLandingPage.constants';
import { TESTING_LANDING_TEST_IDS } from './TestingAndSyntheticsLandingPage.testIds';

async function renderLanding(node: NavModelItem) {
  const res = render(<TestingAndSyntheticsLandingPage node={node} />);
  await screen.findByTestId(TESTING_LANDING_TEST_IDS.root);
  return res;
}

describe('TestingAndSyntheticsLandingPage', () => {
  describe('page shell', () => {
    it('does not render a duplicate page header', async () => {
      await renderLanding(NAV_BOTH_PLUGINS);
      expect(screen.queryByRole('heading', { level: 1, name: 'Testing & synthetics' })).not.toBeInTheDocument();
    });

    it('shows Agentic, Performance, and SM when all plugins installed', async () => {
      await renderLanding(NAV_BOTH_PLUGINS);
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.agenticCard)).toBeInTheDocument();
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.performancePanel)).toBeInTheDocument();
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.syntheticsPanel)).toBeInTheDocument();
    });

    it('hides Agentic card when agentic plugin is not in nav', async () => {
      await renderLanding(NAV_K6_ONLY);
      expect(screen.queryByTestId(TESTING_LANDING_TEST_IDS.agenticCard)).not.toBeInTheDocument();
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.performancePanel)).toBeInTheDocument();
    });

    it('shows only SM panel when k6 not in nav', async () => {
      await renderLanding(NAV_SM_ONLY);
      expect(screen.queryByTestId(TESTING_LANDING_TEST_IDS.agenticCard)).not.toBeInTheDocument();
      expect(screen.queryByTestId(TESTING_LANDING_TEST_IDS.performancePanel)).not.toBeInTheDocument();
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.syntheticsPanel)).toBeInTheDocument();
    });

    it('shows Performance but not SM when SM not in nav', async () => {
      await renderLanding(NAV_AGENTIC_K6);
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.agenticCard)).toBeInTheDocument();
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.performancePanel)).toBeInTheDocument();
      expect(screen.queryByTestId(TESTING_LANDING_TEST_IDS.syntheticsPanel)).not.toBeInTheDocument();
    });
  });

  describe('Agentic featured card', () => {
    it('Agentic Open link points to agentic home', async () => {
      await renderLanding(NAV_AGENTIC_K6);
      const card = screen.getByTestId(TESTING_LANDING_TEST_IDS.agenticCard);
      const open = within(card).getByRole('link', { name: /Open/i });
      expect(open).toHaveAttribute('href', AGENTIC_URLS.home);
    });

    it('Agentic Create link points to agentic new', async () => {
      await renderLanding(NAV_AGENTIC_K6);
      const card = screen.getByTestId(TESTING_LANDING_TEST_IDS.agenticCard);
      const create = within(card).getByRole('link', { name: /Create a test/i });
      expect(create).toHaveAttribute('href', AGENTIC_URLS.create);
    });

    it('clicking Create does not trigger card navigation', async () => {
      const { user } = await renderLanding(NAV_AGENTIC_K6);
      const card = screen.getByTestId(TESTING_LANDING_TEST_IDS.agenticCard);
      const create = within(card).getByRole('link', { name: /Create a test/i });
      await user.click(create);
      expect(locationService.push).toHaveBeenCalledWith(AGENTIC_URLS.create);
      expect(locationService.push).not.toHaveBeenCalledWith(AGENTIC_URLS.home);
    });

    it('clicking featured card navigates to agentic home', async () => {
      const { user } = await renderLanding(NAV_AGENTIC_K6);
      await user.click(screen.getByTestId(TESTING_LANDING_TEST_IDS.agenticCard));
      expect(locationService.push).toHaveBeenCalledWith(AGENTIC_URLS.home);
    });

    it('renders accent bar', async () => {
      await renderLanding(NAV_AGENTIC_K6);
      expect(screen.getByTestId(TESTING_LANDING_TEST_IDS.accentBar)).toBeInTheDocument();
    });
  });

  describe('Performance testing panel', () => {
    it('Performance panel shows description and action buttons', async () => {
      await renderLanding(NAV_K6_ONLY);
      const panel = screen.getByTestId(TESTING_LANDING_TEST_IDS.performancePanel);
      expect(within(panel).getByText(/Run tests, catch regressions/)).toBeInTheDocument();
      expect(within(panel).getByRole('link', { name: /Browse projects/i })).toBeInTheDocument();
      expect(within(panel).getByRole('link', { name: /Start testing/i })).toBeInTheDocument();
    });

    it('Performance Open link and buttons use correct routes', async () => {
      await renderLanding(NAV_K6_ONLY);
      const panel = screen.getByTestId(TESTING_LANDING_TEST_IDS.performancePanel);
      expect(within(panel).getByRole('link', { name: /^Open/i })).toHaveAttribute('href', K6_URLS.home);
      expect(within(panel).getByRole('link', { name: /Browse projects/i })).toHaveAttribute('href', K6_URLS.projects);
      expect(within(panel).getByRole('link', { name: /Start testing/i })).toHaveAttribute('href', K6_URLS.home);
    });
  });

  describe('Synthetic monitoring panel', () => {
    it('SM panel shows three action tiles with descriptions', async () => {
      await renderLanding(NAV_SM_ONLY);
      const panel = screen.getByTestId(TESTING_LANDING_TEST_IDS.syntheticsPanel);
      expect(within(panel).getByText('Make a check')).toBeInTheDocument();
      expect(within(panel).getByText(/Set up browser, HTTP, or scripted checks/)).toBeInTheDocument();
      expect(within(panel).getByText('Manage probes')).toBeInTheDocument();
      expect(within(panel).getByText(/Choose where checks run/)).toBeInTheDocument();
      expect(within(panel).getByText('Get Terraform config')).toBeInTheDocument();
      expect(within(panel).getByText(/Export checks, probes, and tokens/)).toBeInTheDocument();
    });

    it('SM tiles link to correct routes', async () => {
      await renderLanding(NAV_SM_ONLY);
      const tiles = screen.getAllByTestId(TESTING_LANDING_TEST_IDS.useCaseTile);
      expect(tiles).toHaveLength(3);
      expect(within(tiles[0]).getByRole('link', { name: /Create/i })).toHaveAttribute('href', SM_URLS.chooseCheck);
      expect(within(tiles[1]).getByRole('link', { name: /Manage/i })).toHaveAttribute('href', SM_URLS.probes);
      expect(within(tiles[2]).getByRole('link', { name: /View/i })).toHaveAttribute('href', SM_URLS.terraform);
    });

    it('tile action button wins over tile container click', async () => {
      const { user } = await renderLanding(NAV_SM_ONLY);
      const tile = screen.getAllByTestId(TESTING_LANDING_TEST_IDS.useCaseTile)[0];
      await user.click(within(tile).getByRole('link', { name: /Create/i }));
      expect(locationService.push).toHaveBeenCalledWith(SM_URLS.chooseCheck);
    });
  });

  describe('assets', () => {
    it('renders product logos with accessible alt text', async () => {
      await renderLanding(NAV_BOTH_PLUGINS);
      expect(screen.getAllByRole('img', { name: /k6/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('img', { name: /Synthetic monitoring/i })).toBeInTheDocument();
    });
  });

  describe('navigation journeys', () => {
    it('user can start SM check flow from landing', async () => {
      const { user } = await renderLanding(NAV_BOTH_PLUGINS);
      const smPanel = screen.getByTestId(TESTING_LANDING_TEST_IDS.syntheticsPanel);
      const makeCheckTile = within(smPanel).getAllByTestId(TESTING_LANDING_TEST_IDS.useCaseTile)[0];
      await user.click(within(makeCheckTile).getByRole('link', { name: /Create/i }));
      expect(locationService.push).toHaveBeenLastCalledWith(SM_URLS.chooseCheck);
    });

    it('user can open k6 from performance panel', async () => {
      const { user } = await renderLanding(NAV_BOTH_PLUGINS);
      const perf = screen.getByTestId(TESTING_LANDING_TEST_IDS.performancePanel);
      await user.click(within(perf).getByRole('link', { name: /Start testing/i }));
      expect(locationService.push).toHaveBeenCalledWith(K6_URLS.home);
    });
  });
});
