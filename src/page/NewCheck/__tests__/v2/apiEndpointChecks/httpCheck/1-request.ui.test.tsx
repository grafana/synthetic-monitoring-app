import { screen, within } from '@testing-library/react';

import { CheckType, HttpMethod } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewForm } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.Http;

describe(`HttpCheck - Section 1 (Request) UI`, () => {
  it(`has HTTP selected in the request type`, async () => {
    await renderNewForm(checkType);

    const requestType = await screen.getByRole('radiogroup');
    expect(within(requestType).getByLabelText('HTTP')).toBeChecked();
  });

  it(`has GET method selected by default in request target`, async () => {
    const { user } = await renderNewForm(checkType);

    await user.click(screen.getByLabelText(/Request method \*/));
    const methodSelect = screen.getByRole('menu', { name: /Select request method/ });
    expect(within(methodSelect).getByText(HttpMethod.Get)).toBeInTheDocument();
  });

  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByRole('button', { name: /Header/ }));

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`Header name is required`);
    expect(err).toBeInTheDocument();
  });

  it(`hints https:// and http:// variants when the target has no protocol`, async () => {
    const { user } = await renderNewForm(checkType);
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'grafana.com');

    expect(await screen.findByText(/Did you mean/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'https://grafana.com' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'http://grafana.com' })).toBeInTheDocument();
  });

  it(`fills in the target with the selected protocol hint`, async () => {
    const { user } = await renderNewForm(checkType);
    const targetInput = screen.getByLabelText('Request target', { exact: false });

    await user.type(targetInput, 'grafana.com');
    await user.click(await screen.findByRole('button', { name: 'https://grafana.com' }));

    expect(targetInput).toHaveValue('https://grafana.com');
    expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  });
});
