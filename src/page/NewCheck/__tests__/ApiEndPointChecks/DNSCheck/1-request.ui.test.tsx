import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 1 (Request) UI`, () => {
  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('DNS Settings'));

    const serverInputPreSubmit = screen.getByLabelText('Server');
    await user.clear(serverInputPreSubmit);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`DNS server is required`, { exact: false });
    expect(err).toBeInTheDocument();
  });
});
