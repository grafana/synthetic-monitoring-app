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

it(`Should not render the limit text when limit is not provided`, async () => {
  renderLabelField({ isEditor: true });
  await screen.findByText('Labels');
  const limitText = await getLimitText();
  expect(limitText).not.toBeInTheDocument();
});

it(`Should render the limit text when limit is provided`, async () => {
  const limit = 5;
  renderLabelField({ isEditor: true, limit });
  await screen.findByText('Labels');
  const limitText = await getLimitText();
  expect(limitText!.textContent?.includes(limit.toString()));
  expect(limitText).toBeInTheDocument();
});

it(`Should render the limit text when limit is provided`, async () => {
  const limit = 5;
  renderLabelField({ isEditor: true, limit });
  await screen.findByText('Labels');
  const limitText = await getLimitText();
  expect(limitText!.textContent?.includes(limit.toString()));
  expect(limitText).toBeInTheDocument();
});

// extract these so we can be sure the negative assertion works
function getLimitText() {
  return screen.queryByText(/You can add up to/, { exact: false });
}
