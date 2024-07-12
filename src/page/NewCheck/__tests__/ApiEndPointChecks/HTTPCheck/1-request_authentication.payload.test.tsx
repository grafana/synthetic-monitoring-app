import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) Authentication payload`, () => {
  it(`can add bearer token`, async () => {
    const BEARER_TOKEN = `a lovely bear`;

    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Authentication'));
    await user.click(screen.getByLabelText('Bearer'));
    await user.type(screen.getByLabelText('Bearer Authorization', { exact: false }), BEARER_TOKEN);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.bearerToken).toBe(BEARER_TOKEN);
  });

  it(`can add basic auth`, async () => {
    const USERNAME = `the user`;
    const PASSWORD = `the password`;

    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Authentication'));
    await user.click(screen.getByLabelText('Basic'));
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
