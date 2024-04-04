import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { LabelField, type LabelFieldProps } from './LabelField';

function renderLabelField(props: LabelFieldProps) {
  const FormWrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm();

    return <FormProvider {...form}>{children}</FormProvider>;
  };

  return waitFor(() =>
    render(
      <FormWrapper>
        <LabelField {...props} />
      </FormWrapper>
    )
  );
}

it(`Should render the probe limit text when probe is the destination`, async () => {
  renderLabelField({ labelDestination: 'probe' });
  await screen.findByText('Labels');
  const limitText = await getLimitText();
  expect(limitText!.textContent?.includes('3'));
  expect(limitText).toBeInTheDocument();
});

it(`Should render the check limit text when check is the destination`, async () => {
  renderLabelField({ labelDestination: 'check' });
  await screen.findByText('Labels');
  const limitText = await getLimitText();
  expect(limitText!.textContent?.includes('10'));
  expect(limitText).toBeInTheDocument();
});

// extract these so we can be sure the negative assertion works
function getLimitText() {
  return screen.queryByText(/You can add up to/, { exact: false });
}
