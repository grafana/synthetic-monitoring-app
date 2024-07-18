import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.TCP;

describe(`TCPCheck - Section 1 (Request) UI`, () => {
  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));

    const certInputPreSubmit = screen.getByLabelText('CA certificate', { exact: false });
    await user.type(certInputPreSubmit, `not a cert`);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`Certificate must be in the PEM format.`);
    expect(err).toBeInTheDocument();
  });
});
