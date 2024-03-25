import React from 'react';
import { screen, within } from '@testing-library/react';
import { BASIC_CHECK_LIST } from 'test/fixtures/checks';
import { render } from 'test/render';

import { HomePage } from './HomePage';

const renderHomePage = () => {
  return render(<HomePage />);
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
    await assertBigValue('Total active series', `536`);
    await assertBigValue('Checks executions per month', '558,251');
    await assertBigValue('Logs per month', '0.53GB');
  });
});
