import React from 'react';
import { screen, within } from '@testing-library/react';
import { render } from 'test/render';

import { Check } from '../../types';

import { DataTestIds } from '../../test/dataTestIds';
import { CheckForm } from './CheckForm';
import { CheckFormContextProvider } from './CheckFormContext';

interface RenderCheckFormProps {
  check?: Check;
  disabled?: boolean;
}

// The "submit" button is only visible as the last step (if not rendered outside the CheckForm)
// This function navigates to the last step of the form and makes sure that there is a "submit" button
async function goToLastStep(result: ReturnType<typeof render>) {
  const navigationContainer = await screen.findByTestId(DataTestIds.FORM_SIDEBAR);
  const steps = await within(navigationContainer).findAllByRole('button');
  const lastStep = steps[steps.length - 1];
  await result.user.click(lastStep);
  await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON); // Wait for the form to be rendered

  return result;
}

async function renderCheckForm(props?: RenderCheckFormProps) {
  const result = render(<CheckForm {...props} />);
  return await goToLastStep(result);
}

async function renderCheckFormWithContext({ check, ...props }: RenderCheckFormProps = {}) {
  const result = render(
    <CheckFormContextProvider check={check}>
      <CheckForm {...props} />
    </CheckFormContextProvider>
  );

  return await goToLastStep(result);
}

describe(`<CheckForm />`, () => {
  it(`should render without context and props`, async () => {
    await renderCheckForm();
    expect(screen.getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).not.toBeEnabled();
  });

  it('should render with context and props', async () => {
    await renderCheckFormWithContext();
    expect(screen.getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).not.toBeEnabled();
  });
});
