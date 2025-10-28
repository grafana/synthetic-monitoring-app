import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) Request Body payload`, () => {
  it(`can add request body`, async () => {
    const REQUEST_BODY = `simple body text`;

    const { read, user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Body'));
    await user.type(screen.getByLabelText('Request body', { selector: `textarea` }), REQUEST_BODY);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.body).toBe(REQUEST_BODY);
  });
});
