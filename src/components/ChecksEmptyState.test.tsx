import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { render } from 'test/render';

import { ChecksEmptyState } from './ChecksEmptyState';

async function renderComponent() {
  const result = render(<ChecksEmptyState />);
  await waitFor(() => screen.getByTestId(DataTestIds.CHECKS_EMPTY_STATE), { timeout: 3000 });

  return result;
}

describe('ChecksEmptyState', () => {
  it('should render', async () => {
    const { container } = await renderComponent();
    expect(container).toBeInTheDocument();
  });

  it('should render the correct message', async () => {
    await renderComponent();

    expect(await screen.findByText("You haven't created any checks yet")).toBeInTheDocument();
  });

  it('should render the correct button', async () => {
    await renderComponent();

    expect(await screen.findByText('Create check')).toBeInTheDocument();
  });

  it('should render the correct link', async () => {
    await renderComponent();

    expect(await screen.findByText('Synthetic Monitoring docs')).toBeInTheDocument();
  });

  it('should render the correct link href', async () => {
    await renderComponent();

    expect(await screen.findByText('Synthetic Monitoring docs')).toHaveAttribute(
      'href',
      'https://grafana.com/docs/grafana-cloud/synthetic-monitoring/'
    );
  });

  it('should render the correct link target', async () => {
    await renderComponent();

    expect(await screen.findByText('Synthetic Monitoring docs')).toHaveAttribute('target', '_blank');
  });
});
