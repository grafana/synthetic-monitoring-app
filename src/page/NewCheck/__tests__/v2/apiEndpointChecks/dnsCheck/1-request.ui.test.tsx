import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 1 (Request) UI`, () => {
  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));

    const serverInputPreSubmit = screen.getByLabelText(/Server \*/);
    await user.clear(serverInputPreSubmit);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`DNS server is required`, { exact: false });
    expect(err).toBeInTheDocument();
  });
});
