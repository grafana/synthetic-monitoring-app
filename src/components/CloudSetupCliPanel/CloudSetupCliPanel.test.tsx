import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { CloudSetupCliPanel } from './CloudSetupCliPanel';

async function renderComponent() {
  const result = render(<CloudSetupCliPanel />);
  await screen.findByRole('button', { name: 'Copy command' });

  return result;
}

describe('CloudSetupCliPanel', () => {
  it('should render the command and preview tag', async () => {
    await renderComponent();

    const commandRow = await screen.findByRole('button', { name: 'Copy command' });
    expect(commandRow).toHaveTextContent(/npx @grafana\/cloud-setup synthetics --stack/);
    expect(await screen.findByText('@grafana/cloud-setup')).toBeInTheDocument();
    expect(await screen.findByText('Preview')).toBeInTheDocument();
    expect(await screen.findByText('Requires Node.js 22.6+ · Uses Grafana Assistant tokens')).toBeInTheDocument();
  });

  it('should show the preview tooltip on hover', async () => {
    const { user } = await renderComponent();

    const previewTab = await screen.findByText('Preview');
    await user.hover(previewTab);

    expect(await screen.findByText(/This CLI is in public preview/)).toBeInTheDocument();
  });

  it('should reveal the "what does it do" explanation without hiding the requirements note', async () => {
    const { user } = await renderComponent();

    const explanation = /installs.*export checks as Terraform/s;
    expect(screen.queryByText(explanation)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'What does it do?' }));

    expect(await screen.findByText(explanation)).toBeInTheDocument();
    expect(screen.queryByText('The setup wizard')).not.toBeInTheDocument();
    expect(await screen.findByText('gcx')).toHaveAttribute(
      'href',
      'https://grafana.com/docs/grafana-cloud/ai-tools/gcx/'
    );
    expect(await screen.findByText('agent skills')).toHaveAttribute(
      'href',
      'https://grafana.com/docs/grafana-cloud/machine-learning/assistant/platform/skills/'
    );
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

  it('should copy the command when clicking anywhere on the command row', async () => {
    const { user } = await renderComponent();

    // render() calls userEvent.setup(), which installs its own clipboard stub on
    // navigator.clipboard — spy on that existing stub rather than replacing it.
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

    const commandRow = await screen.findByRole('button', { name: 'Copy command' });
    await user.click(commandRow);

    await waitFor(() =>
      expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('npx @grafana/cloud-setup synthetics --stack'))
    );
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('should copy the command when activated from the keyboard', async () => {
    const { user } = await renderComponent();

    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');

    const commandRow = await screen.findByRole('button', { name: 'Copy command' });
    commandRow.focus();
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('npx @grafana/cloud-setup synthetics --stack'))
    );
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});
