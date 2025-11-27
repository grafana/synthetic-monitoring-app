import React from 'react';
import { screen } from '@testing-library/react';
import { APP_INITIALIZER_TEST_ID } from 'test/dataTestIds';

import { AppRoutes } from 'routing/types';

import { AppInitializer } from '../../../components/AppInitializer';
import { render } from '../../../test/render';
import { UninitializedTab } from './UninitializedTab';

jest.mock('../../../components/AppInitializer', () => {
  return {
    AppInitializer: jest
      .fn()
      .mockImplementation(({ buttonText, redirectTo }: { buttonText: string; redirectTo?: AppRoutes }) => (
        <div data-testid={APP_INITIALIZER_TEST_ID.root}>
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
    expect(AppInitializer).toHaveBeenCalledWith({ buttonText: 'Initialize plugin', redirectTo: AppRoutes.Config }, {});
  });
});
