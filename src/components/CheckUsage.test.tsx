import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { render } from 'test/render';

import { Check, CheckType } from 'types';

import { CheckFormContextProvider } from './CheckForm/CheckFormContext';
import { CheckUsage } from './CheckUsage';
import { fallbackCheckMap } from './constants';

function RenderWrapper({ check }: { check?: Check }) {
  return (
    <CheckFormContextProvider check={check}>
      <CheckUsage checkType={CheckType.HTTP} />
    </CheckFormContextProvider>
  );
}

async function renderComponent(check?: Check) {
  const result = render(<RenderWrapper />);
  await waitFor(() => screen.findByTestId(DataTestIds.CHECK_USAGE), { timeout: 3000 });

  return result;
}

describe('CheckUsage', () => {
  describe('existing check', () => {
    const mockedCheck = fallbackCheckMap[CheckType.HTTP];
    it('should render', async () => {
      const { container } = await renderComponent(mockedCheck);
      expect(container).toBeInTheDocument();
    });

    it('should render the correct label', async () => {
      await renderComponent(mockedCheck);
      expect(
        await screen.findByText('Estimated usage for this check', { selector: 'label > div' })
      ).toBeInTheDocument();
    });
  });

  describe('new check', () => {
    it('should render', async () => {
      const { container } = await renderComponent();
      expect(container).toBeInTheDocument();
    });

    it('should render the correct label', async () => {
      await renderComponent();
      expect(
        await screen.findByText('Estimated usage for this check', { selector: 'label > div' })
      ).toBeInTheDocument();
    });
  });
});
