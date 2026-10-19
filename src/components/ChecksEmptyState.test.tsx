import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { render } from 'test/render';
import { runTestAsSMViewer } from 'test/utils';

import { ChecksEmptyState } from './ChecksEmptyState';

async function renderComponent() {
  const result = render(<ChecksEmptyState />);
  await waitFor(() => screen.getByTestId(CHECKS_TEST_ID.emptyState), { timeout: 3000 });

  return result;
}

describe('ChecksEmptyState', () => {
  it('should offer check configuration and a coding agent as alternatives to the wizard', async () => {
    const { user } = await renderComponent();
    const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
    reportInteraction.mockClear();

    expect(await screen.findByText("You haven't created any checks yet")).toBeInTheDocument();
    expect(await screen.findByText('Run the setup wizard in your terminal to create your first checks.')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Coding agent prompt' })).not.toBeInTheDocument();

    const command = screen.getByRole('button', { name: 'Copy command' });
    const createCheck = screen.getByRole('link', { name: 'Other ways to create checks' });
    expect(createCheck).toHaveAttribute('href', '/a/grafana-synthetic-monitoring-app/checks/choose-type');

    await user.tab();
    expect(command).toHaveFocus();
    await user.tab();
    expect(createCheck).toHaveFocus();
    await user.tab();
    const agentButton = screen.getByRole('button', { name: 'Use your coding agent' });
    expect(agentButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(agentButton).toHaveAttribute('aria-expanded', 'true');
    const prompt = await screen.findByRole('region', { name: 'Coding agent prompt' });
    expect(document.getElementById(agentButton.getAttribute('aria-controls')!)).toContainElement(prompt);
    expect(createCheck).toBeVisible();
    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_cloud_setup_agent_prompt_shown',
      expect.anything()
    );
    expect(reportInteraction).not.toHaveBeenCalledWith(
      'synthetic-monitoring_cloud_setup_agent_prompt_copied',
      expect.anything()
    );

    await user.keyboard('{Enter}');
    expect(agentButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Coding agent prompt' })).not.toBeInTheDocument();
  });

  it('should hide the setup wizard for users without permission to create checks', async () => {
    runTestAsSMViewer();

    await renderComponent();

    expect(await screen.findByText('Other ways to create checks')).toBeInTheDocument();
    expect(screen.getByText('Get started monitoring your services with Grafana Cloud')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Copy command' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use your coding agent' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Other ways to create checks' })).toHaveAttribute('aria-disabled', 'true');
  });
});
