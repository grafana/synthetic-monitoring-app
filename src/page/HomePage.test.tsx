import React from 'react';
import { screen, within } from '@testing-library/react';

import { render } from 'test/render';
import { HomePage } from './HomePage';
import { CheckInfoContextProvider } from 'components/CheckInfoContextProvider';

const renderHomePage = () => {
  return render(
    <CheckInfoContextProvider>
      <HomePage />
    </CheckInfoContextProvider>
  );
};

const assertBigValue = async (label: string, value: string) => {
  const labelEl = await screen.findByText(label);
  const parent = labelEl.parentElement;
  if (!parent) {
    throw new Error(`Could not find label with text ${label}`);
  }
  const valueEl = await within(parent).findByText(value);
  expect(valueEl).toBeInTheDocument();
};

describe('Information is present', () => {
  test('shows usage', async () => {
    renderHomePage();
    await assertBigValue('Total checks', '1');
    await assertBigValue('Total active series', '81');
    await assertBigValue('Checks executions per month', '43,800');
    await assertBigValue('Logs per month', '0.04GB');
  });
});
