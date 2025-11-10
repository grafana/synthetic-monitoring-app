import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) Authentication payload`, () => {
  it(`can add bearer token`, async () => {
    const BEARER_TOKEN = `a lovely bear`;

    const { read, user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Authentication'));
    await user.click(screen.getByLabelText('Bearer Token'));
    await user.type(screen.getByLabelText('Token *', { exact: false }), BEARER_TOKEN);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.bearerToken).toBe(BEARER_TOKEN);
  });

  it(`can add basic auth`, async () => {
    const USERNAME = `the user`;
    const PASSWORD = `the password`;

    const { read, user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Authentication'));
    await user.click(screen.getByLabelText('Basic Auth'));
    await user.type(screen.getByLabelText('Username *'), USERNAME);
    await user.type(screen.getByLabelText('Password *'), PASSWORD);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.basicAuth).toStrictEqual({
      username: USERNAME,
      password: PASSWORD,
    });
  });
});
