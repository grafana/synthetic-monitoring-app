import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { render } from 'test/render';

import { ChecksEmptyState } from './ChecksEmptyState';

async function renderComponent() {
  const result = render(<ChecksEmptyState />);
  await waitFor(() => screen.getByTestId(CHECKS_TEST_ID.emptyState), { timeout: 3000 });

  return result;
}

describe('ChecksEmptyState', () => {
  it('should render all components correctly', async () => {
    const { container } = await renderComponent();

    // Verify container renders
    expect(container).toBeInTheDocument();

    // Verify correct message
    expect(await screen.findByText("You haven't created any checks yet")).toBeInTheDocument();

    // The subtitle points to the CLI, and the command is shown up front as the main option
    expect(
      await screen.findByText('Get started monitoring your services with Grafana Cloud')
    ).toBeInTheDocument();
    expect(await screen.findByText('Or run our CLI-based setup wizard:')).toBeInTheDocument();

    // The command is split across nodes so the package name can be highlighted separately
    const commandRow = await screen.findByRole('button', { name: 'Copy command' });
    expect(commandRow).toHaveTextContent(/npx @grafana\/cloud-setup synthetics --stack/);
    expect(await screen.findByText('@grafana/cloud-setup')).toBeInTheDocument();
    expect(
      await screen.findByText('Requires Node.js 22.6+ and consumes Grafana Assistant tokens.')
    ).toBeInTheDocument();

    // Manual creation is still available, as the primary top-level action
    expect(await screen.findByText('Create your first check')).toBeInTheDocument();
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
});
