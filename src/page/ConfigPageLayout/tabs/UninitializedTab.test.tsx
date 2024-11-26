import React from 'react';
import { screen } from '@testing-library/react';

import { ROUTES } from 'routing/types';

import { AppInitializer } from '../../../components/AppInitializer';
import { DataTestIds } from '../../../test/dataTestIds';
import { render } from '../../../test/render';
import { UninitializedTab } from './UninitializedTab';

jest.mock('../../../components/AppInitializer', () => {
  return {
    AppInitializer: jest
      .fn()
      .mockImplementation(({ buttonText, redirectTo }: { buttonText: string; redirectTo?: ROUTES }) => (
        <div data-testid={DataTestIds.APP_INITIALIZER}>
          <button>{buttonText}</button>
        </div>
      )),
  };
});

async function renderUninitializedTab() {
  const result = render(<UninitializedTab />);
  await screen.findByText('Synthetic Monitoring is not yet initialized');

  return result;
}

describe('<UninitializedTab />', () => {
  it('should render', () => {
    renderUninitializedTab();
  });

  it('should show initialization button', async () => {
    const { getByText } = await renderUninitializedTab();
    const button = getByText('Initialize plugin', { selector: 'button' });

    expect(button).toBeInTheDocument();
  });

  it('should use <AppInitializer />', async () => {
    await renderUninitializedTab();
    expect(AppInitializer).toHaveBeenCalledWith({ buttonText: 'Initialize plugin', redirectTo: ROUTES.Config }, {});
  });
});
