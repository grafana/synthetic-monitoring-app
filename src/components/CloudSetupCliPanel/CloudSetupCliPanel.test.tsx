import React from 'react';
import { config } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { CloudSetupCliPanel } from './CloudSetupCliPanel';

async function renderComponent() {
  const result = render(<CloudSetupCliPanel />);
  await screen.findByRole('button', { name: 'Copy command' });

  return result;
}

describe('CloudSetupCliPanel', () => {
  beforeAll(() => {
    // JSDOM does not expose the secure-context signal used by ClipboardButton.
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  });

  it('should show the command and its requirements before copying', async () => {
    await renderComponent();

    const command = screen.getByRole('code');
    expect(command).toHaveTextContent('npx @grafana/cloud-setup synthetics --stack');
    expect(await screen.findByText('Requires Node.js 22.6+ · Uses Grafana Assistant tokens')).toBeInTheDocument();
  });

  it('should report a view once when the panel mounts', async () => {
    const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
    reportInteraction.mockClear();

    await renderComponent();

    const views = reportInteraction.mock.calls.filter(
      (call) => call[0] === 'synthetic-monitoring_cloud_setup_cli_panel_shown'
    );
    expect(views).toHaveLength(1);
  });

  it('should report the view and the copy as separate events', async () => {
    const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
    reportInteraction.mockClear();

    const { user } = await renderComponent();
    await user.click(await screen.findByRole('button', { name: 'Copy command' }));

    await waitFor(() =>
      expect(reportInteraction).toHaveBeenCalledWith(
        'synthetic-monitoring_cloud_setup_cli_command_copied',
        expect.anything()
      )
    );
    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_cloud_setup_cli_panel_shown',
      expect.anything()
    );
  });

  it('should leave the command text selectable and copy the complete command from the copy button', async () => {
    jest.replaceProperty(config, 'appUrl', 'https://long-production-monitoring-stack.grafana.net/');
    const { user } = await renderComponent();

    // render() calls userEvent.setup(), which installs its own clipboard stub on
    // navigator.clipboard — spy on that existing stub rather than replacing it.
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

    const command = 'npx @grafana/cloud-setup synthetics --stack long-production-monitoring-stack.grafana.net';
    expect(screen.getByRole('code')).toHaveTextContent(command);
    await user.click(screen.getByText('npx'));
    expect(writeTextSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Copy command' }));

    await waitFor(() => expect(writeTextSpy).toHaveBeenCalledWith(command));
    expect(await screen.findByRole('alert')).toHaveTextContent('Copied');
  });

  it('should copy the command when activated from the keyboard', async () => {
    const { user } = await renderComponent();

    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

    const copyButton = screen.getByRole('button', { name: 'Copy command' });
    copyButton.focus();
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('npx @grafana/cloud-setup synthetics --stack'))
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Copied');
  });

  it('should keep the command visible and allow retrying when clipboard access fails', async () => {
    const { user } = await renderComponent();
    const writeTextSpy = jest
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValueOnce(new Error('Clipboard denied'));
    const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
    reportInteraction.mockClear();

    await user.click(screen.getByRole('button', { name: 'Copy command' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not copy. Select and copy the command above.');
    expect(screen.getByRole('code')).toBeVisible();
    expect(reportInteraction).not.toHaveBeenCalledWith(
      'synthetic-monitoring_cloud_setup_cli_command_copied',
      expect.anything()
    );

    writeTextSpy.mockResolvedValueOnce();
    await user.click(screen.getByRole('button', { name: 'Copy command' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Copied'));
    expect(screen.queryByText('Could not copy. Select and copy the command above.')).not.toBeInTheDocument();
    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_cloud_setup_cli_command_copied',
      expect.anything()
    );
  });
});
