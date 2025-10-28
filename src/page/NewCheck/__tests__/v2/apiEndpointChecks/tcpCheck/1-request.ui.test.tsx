import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.TCP;

describe(`TCPCheck - Section 1 (Request) UI`, () => {
  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS'));

    const certInputPreSubmit = screen.getByLabelText('CA certificate', { exact: false });
    await user.type(certInputPreSubmit, `not a cert`);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`Certificate must be in the PEM format.`);
    expect(err).toBeInTheDocument();
  });
});
