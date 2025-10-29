import { screen } from '@testing-library/react';

import { CheckType, IpVersion } from 'types';
import { getCheckbox, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) Request Options payload`, () => {
  it(`can add request headers`, async () => {
    const HEADER_KEY_1 = `header-key-1`;
    const HEADER_VALUE_1 = `header-value-1`;
    const HEADER_KEY_2 = `header-key-2`;
    const HEADER_VALUE_2 = `header-value-2`;

    const { read, user } = await renderNewFormV2(checkType);

    await user.click(screen.getByText('Request options'));
    const addRequestHeaderButton = screen.getByRole('button', { name: /Header/ });
    await user.click(addRequestHeaderButton);

    const headerKeyInput = await screen.findByLabelText('Request headers 1 name');
    const headerValueInput = await screen.findByLabelText('Request headers 1 value');

    await user.type(headerKeyInput, HEADER_KEY_1);
    await user.type(headerValueInput, HEADER_VALUE_1);
    await user.click(addRequestHeaderButton);

    const headerKeyInput2 = await screen.findByLabelText('Request headers 2 name');
    const headerValueInput2 = await screen.findByLabelText('Request headers 2 value');

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

    const { read, user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByLabelText('IPv6'));

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.ipVersion).toBe(IP_VERSION);
  });

  it(`can submit follow redirects`, async () => {
    const { read, user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(getCheckbox('Follow redirects'));
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.noFollowRedirects).toBe(true);
  });
});
