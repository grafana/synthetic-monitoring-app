import { screen, within } from '@testing-library/react';

import { CheckType, HttpMethod } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) UI`, () => {
  it(`has HTTP selected in the request type`, async () => {
    await renderNewFormV2(checkType);

    const requestType = await screen.getByRole('radiogroup');
    expect(within(requestType).getByLabelText('HTTP')).toBeChecked();
  });

  it(`has GET method selected by default in request target`, async () => {
    const { user } = await renderNewFormV2(checkType);

    await user.click(screen.getByLabelText(/Request method \*/));
    const methodSelect = screen.getByRole('menu', { name: /Select request method/ });
    expect(within(methodSelect).getByText(HttpMethod.GET)).toBeInTheDocument();
  });

  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByRole('button', { name: /Header/ }));

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`Header name is required`);
    expect(err).toBeInTheDocument();
  });
});
