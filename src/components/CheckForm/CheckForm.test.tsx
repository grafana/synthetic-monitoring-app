import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { Check } from '../../types';

import { DataTestIds } from '../../test/dataTestIds';
import { CheckForm } from './CheckForm';

interface RenderCheckFormProps {
  check?: Check;
  disabled?: boolean;
}

async function renderCheckForm(props?: RenderCheckFormProps) {
  const result = render(<CheckForm {...props} />);
  await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON); // Wait for the form to be rendered

  return result;
}

describe(`<CheckForm />`, () => {
  it(`should render without props`, async () => {
    await renderCheckForm();
    expect(screen.getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).not.toBeEnabled();
  });
});
