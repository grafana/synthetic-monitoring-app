import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { render } from 'test/render';

import { CheckFormValues, CheckType } from 'types';

import { toFormValues } from './CheckEditor/checkFormTransformations';
import { CheckFormContextProvider } from './CheckForm/CheckFormContext/CheckFormContext';
import { CheckUsage } from './CheckUsage';
import { fallbackCheckMap } from './constants';

function RenderWrapper() {
  const mockedCheck = fallbackCheckMap[CheckType.HTTP];
  const defaultValues = toFormValues(mockedCheck, CheckType.HTTP);

  const form = useForm<CheckFormValues>({ defaultValues });
  return (
    <FormProvider {...form}>
      <CheckFormContextProvider disabled={false}>
        <CheckUsage checkType={CheckType.HTTP} />
      </CheckFormContextProvider>
    </FormProvider>
  );
}

async function renderComponent() {
  const result = render(<RenderWrapper />);
  await waitFor(() => screen.findByTestId(DataTestIds.CHECK_USAGE), { timeout: 3000 });

  return result;
}

describe('CheckUsage', () => {
  it('should render', async () => {
    const { container } = await renderComponent();
    expect(container).toBeInTheDocument();
  });

  it('should render the correct label', async () => {
    await renderComponent();

    expect(await screen.findByText('Estimated usage for this check', { selector: 'label > div' })).toBeInTheDocument();
  });
});
