import React from 'react';
import { screen, within } from '@testing-library/react';
import { BASIC_CHECK_LIST } from 'test/fixtures/checks';
import { render } from 'test/render';

import { CheckInfoContextProvider } from 'components/CheckInfoContextProvider';

import { HomePage } from './HomePage';

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
    await assertBigValue('Total checks', String(BASIC_CHECK_LIST.length));
    await assertBigValue('Total active series', `494`);
    await assertBigValue('Checks executions per month', '573,382');
    await assertBigValue('Logs per month', '0.47GB');
  });
});
