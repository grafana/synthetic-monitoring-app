import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { getTenantLimits } from 'test/handlers/tenants';
import { render } from 'test/render';
import { server } from 'test/server';

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

it(`Should show a warning and a retry when the limits fetch fails`, async () => {
  // set the limits endpoint to fail
  server.use(apiRoute('getTenantLimits', { result: () => ({ status: 500, body: 'Error message' }) }));
  const { user } = await renderLabelField({ labelDestination: 'check' });
  await screen.findByText('Labels');
  const warningBanner = await screen.findByText("Couldn't fetch label limits");
  expect(warningBanner).toBeInTheDocument();

  // reset limits endpoint to succeed
  server.use(apiRoute('getTenantLimits', getTenantLimits));
  const retry = await screen.findByText('Retry');
  await user.click(retry);
  waitFor(() => expect(screen.queryByText("Couldn't fetch label limits")).not.toBeInTheDocument());
});

// extract these so we can be sure the negative assertion works
function getLimitText() {
  return screen.queryByText(/You can add up to/, { exact: false });
}
