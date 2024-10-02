import { screen } from '@testing-library/react';
import { selectOption } from 'test/utils';

import { CheckType, IpVersion } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) Request Options payload`, () => {
  it(`can add request headers`, async () => {
    const HEADER_KEY_1 = `header-key-1`;
    const HEADER_VALUE_1 = `header-value-1`;
    const HEADER_KEY_2 = `header-key-2`;
    const HEADER_VALUE_2 = `header-value-2`;

    const { read, user } = await renderNewForm(checkType);

    await user.click(screen.getByText('Request options'));
    const addRequestHeaderButton = screen.getByText(`Add request header`, { exact: false });
    await user.click(addRequestHeaderButton);

    const headerKeyInput = await screen.findByLabelText('Request header 1 name');
    const headerValueInput = await screen.findByLabelText('Request header 1 value');

    await user.type(headerKeyInput, HEADER_KEY_1);
    await user.type(headerValueInput, HEADER_VALUE_1);
    await user.click(addRequestHeaderButton);

    const headerKeyInput2 = await screen.findByLabelText('Request header 2 name');
    const headerValueInput2 = await screen.findByLabelText('Request header 2 value');

    await user.type(headerKeyInput2, HEADER_KEY_2);
    await user.type(headerValueInput2, HEADER_VALUE_2);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.headers).toEqual([
      `${HEADER_KEY_1}:${HEADER_VALUE_1}`,
      `${HEADER_KEY_2}:${HEADER_VALUE_2}`,
    ]);
  });

  it(`can submit the IP version`, async () => {
    const IP_VERSION = IpVersion.V6;

    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await selectOption(user, { label: 'IP version', option: IP_VERSION });

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.ipVersion).toBe(IP_VERSION);
  });

  it(`can submit follow redirects`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByLabelText('Follow redirects'));

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.noFollowRedirects).toBe(true);
  });
});
