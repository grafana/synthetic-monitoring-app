import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { SCENES_TEST_ID } from 'test/dataTestIds';
import { render } from 'test/render';

import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';

import { SummaryErrorPctgEmptyState } from './SummaryErrorPctgEmptyState';

async function renderComponent() {
  const result = render(<SummaryErrorPctgEmptyState />);
  await waitFor(() => screen.getByTestId(SCENES_TEST_ID.summary.errorPctgEmptyState), { timeout: 3000 });

  return result;
}

describe('SummaryErrorPctgEmptyState', () => {
  it('frames a zero-error result as healthy', async () => {
    await renderComponent();

    expect(await screen.findByText('No errors in this range')).toBeInTheDocument();
    expect(
      await screen.findByText('Matching checks ran cleanly — an error rate of 0% is expected here.')
    ).toBeInTheDocument();

    const checksLink = await screen.findByText('View matching checks');
    expect(checksLink).toBeInTheDocument();
    expect(checksLink).toHaveAttribute('href', `${PLUGIN_URL_PATH}${AppRoutes.Checks}`);
  });
});
