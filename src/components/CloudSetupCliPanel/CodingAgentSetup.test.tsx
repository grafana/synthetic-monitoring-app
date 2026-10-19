import React from 'react';
import { config } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { CodingAgentSetup } from './CodingAgentSetup';

async function renderComponent() {
  const result = render(<CodingAgentSetup />);
  await screen.findByRole('button', { name: 'Use your coding agent' });
  return result;
}

describe('CodingAgentSetup', () => {
  beforeAll(() => {
    // JSDOM does not expose the secure-context signal used by ClipboardButton.
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  });

  it('should expand from the heading and copy the complete prompt without collapsing', async () => {
    jest.replaceProperty(config, 'appUrl', 'https://my-stack.grafana.net/');
    const { user } = await renderComponent();
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');
    const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
    reportInteraction.mockClear();

    expect(screen.queryByRole('region', { name: 'Coding agent prompt' })).not.toBeInTheDocument();
    await user.click(screen.getByText('Use your coding agent'));
    const prompt = await screen.findByRole('region', { name: 'Coding agent prompt' });
    expect(prompt).toHaveTextContent('https://my-stack.grafana.net');
    expect(prompt).toHaveTextContent('Install gcx if needed');
    expect(prompt).toHaveTextContent('ask me to approve the plan');
    expect(prompt.textContent).toContain('\n\n1. ');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Copy prompt' }).focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent('Copied');
    expect(writeTextSpy).toHaveBeenCalledWith(prompt.textContent);
    expect(prompt).toBeVisible();
    expect(screen.getByRole('button', { name: 'Use your coding agent' })).toHaveAttribute('aria-expanded', 'true');
    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_cloud_setup_agent_prompt_copied',
      expect.anything()
    );
    expect(reportInteraction).not.toHaveBeenCalledWith(
      'synthetic-monitoring_cloud_setup_cli_command_copied',
      expect.anything()
    );

    await user.click(screen.getByText('Use your coding agent'));
    expect(screen.queryByRole('region', { name: 'Coding agent prompt' })).not.toBeInTheDocument();
  });

  it('should keep the prompt selectable and allow retrying when clipboard access fails', async () => {
    const { user } = await renderComponent();
    await user.click(screen.getByRole('button', { name: 'Use your coding agent' }));
    const writeTextSpy = jest
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValueOnce(new Error('Clipboard denied'));

    await user.click(screen.getByRole('button', { name: 'Copy prompt' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not copy. Select and copy the prompt below.');
    expect(screen.getByRole('region', { name: 'Coding agent prompt' })).toBeVisible();
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();

    writeTextSpy.mockResolvedValueOnce();
    await user.click(screen.getByRole('button', { name: 'Copy prompt' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Copied'));
    expect(screen.queryByText('Could not copy. Select and copy the prompt below.')).not.toBeInTheDocument();
  });
});
