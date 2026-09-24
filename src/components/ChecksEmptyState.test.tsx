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
  it('should render the message, subtitle, primary button, and CLI panel', async () => {
    const { container } = await renderComponent();

    expect(container).toBeInTheDocument();
    expect(await screen.findByText("You haven't created any checks yet")).toBeInTheDocument();
    expect(
      await screen.findByText('Get started monitoring your services with Grafana Cloud')
    ).toBeInTheDocument();
    expect(await screen.findByText('Or run our setup wizard in your project folder:')).toBeInTheDocument();
    expect(await screen.findByText('Create your first check')).toBeInTheDocument();

    // The CLI panel itself (command, tooltip, particles, disclosure) is covered by
    // CloudSetupCliPanel's own tests — this just confirms it's actually composed in here.
    expect(await screen.findByRole('button', { name: 'Copy command' })).toBeInTheDocument();
  });
});
