import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { render } from 'test/render';

import { Check, CheckType } from 'types';

import { ChecksterProvider } from './Checkster/contexts/ChecksterContext';
import { CheckUsage } from './CheckUsage';
import { fallbackCheckMap } from './constants';

function RenderWrapper() {
  return (
    <ChecksterProvider>
      <CheckUsage checkType={CheckType.Http} />
    </ChecksterProvider>
  );
}

async function renderComponent(check?: Check) {
  const result = render(<RenderWrapper />);
  await waitFor(() => screen.findByTestId(CHECKS_TEST_ID.usage), { timeout: 3000 });

  return result;
}

describe('CheckUsage', () => {
  describe('existing check', () => {
    const mockedCheck = fallbackCheckMap[CheckType.Http];
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
