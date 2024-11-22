import React from 'react';

import { DataTestIds } from '../../../test/dataTestIds';
import { render } from '../../../test/render';
import { AccessTokensTab } from './AccessTokensTab';

async function renderAccessTokensTab() {
  const result = render(<AccessTokensTab />);
  await result.findByTestId(DataTestIds.CONFIG_CONTENT);

  return result;
}

describe('AccessTokensTab', () => {
  it('should render', async () => {
    const { container } = await renderAccessTokensTab();
    expect(container).toBeInTheDocument();
  });

  it('should render with title', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Access tokens')).toBeInTheDocument();
  });

  it('should have a section on access tokens', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Access tokens', { selector: 'h2' })).toBeInTheDocument();
  });

  it('should have a section on synthetic monitoring', async () => {
    const { getByText, queryByText } = await renderAccessTokensTab();
    expect(getByText('Synthetic monitoring', { selector: 'h3' })).toBeInTheDocument();
    expect(queryByText('Generate access token', { selector: 'button > span' })).toBeInTheDocument();
  });

  it('should have a section on private probes', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Private probes', { selector: 'h3' })).toBeInTheDocument();
  });
});
