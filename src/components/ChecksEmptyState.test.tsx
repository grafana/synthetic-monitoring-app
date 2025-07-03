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
  it('should render all components correctly', async () => {
    const { container } = await renderComponent();
    
    // Verify container renders
    expect(container).toBeInTheDocument();
    
    // Verify correct message
    expect(await screen.findByText("You haven't created any checks yet")).toBeInTheDocument();
    
    // Verify correct button
    expect(await screen.findByText('Create check')).toBeInTheDocument();
    
    // Verify correct link text
    const docsLink = await screen.findByText('Synthetic Monitoring docs');
    expect(docsLink).toBeInTheDocument();
    
    // Verify link href
    expect(docsLink).toHaveAttribute(
      'href',
      'https://grafana.com/docs/grafana-cloud/synthetic-monitoring/'
    );
    
    // Verify link target
    expect(docsLink).toHaveAttribute('target', '_blank');
  });
});
