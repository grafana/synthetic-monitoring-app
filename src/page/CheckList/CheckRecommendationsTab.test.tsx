import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { render } from 'test/render';

import { CheckRecommendationsTab } from './CheckRecommendationsTab';

async function renderComponent() {
  const result = render(<CheckRecommendationsTab />);
  await waitFor(() => screen.getByTestId(CHECKS_TEST_ID.recommendations), { timeout: 3000 });
  return result;
}

describe('CheckRecommendationsTab', () => {
  it('renders the empty recommendations state', async () => {
    await renderComponent();

    expect(await screen.findByText('No recommendations yet')).toBeInTheDocument();
    expect(await screen.findByText('Recommended checks will show up here.')).toBeInTheDocument();
  });
});
