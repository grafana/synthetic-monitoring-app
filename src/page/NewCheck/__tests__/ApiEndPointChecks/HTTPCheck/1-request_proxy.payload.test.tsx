import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) Request Options payload`, () => {
  it(`can add proxy URL`, async () => {
    const PROXY_URL = `https://proxy.com`;

    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Proxy'));
    await user.type(screen.getByLabelText('Proxy URL', { exact: false }), PROXY_URL);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.proxyURL).toBe(PROXY_URL);
  });

  it(`can add proxy headers`, async () => {
    const PROXY_HEADER_KEY_1 = `proxy-header-key-1`;
    const PROXY_HEADER_VALUE_1 = `proxy-header-value-1`;
    const PROXY_HEADER_KEY_2 = `proxy-header-key-2`;
    const PROXY_HEADER_VALUE_2 = `proxy-header-value-2`;

    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Proxy'));
    const addRequestHeaderButton = screen.getByText(`Add proxy connect header`, { exact: false });
    await user.click(addRequestHeaderButton);

    const headerKeyInput = await screen.findByLabelText('Proxy connect header 1 name');
    const headerValueInput = await screen.findByLabelText('Proxy connect header 1 value');

    await user.type(headerKeyInput, PROXY_HEADER_KEY_1);
    await user.type(headerValueInput, PROXY_HEADER_VALUE_1);
    await user.click(addRequestHeaderButton);

    const headerKeyInput2 = await screen.findByLabelText('Proxy connect header 2 name');
    const headerValueInput2 = await screen.findByLabelText('Proxy connect header 2 value');

    await user.type(headerKeyInput2, PROXY_HEADER_KEY_2);
    await user.type(headerValueInput2, PROXY_HEADER_VALUE_2);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.proxyConnectHeaders).toEqual([
      `${PROXY_HEADER_KEY_1}:${PROXY_HEADER_VALUE_1}`,
      `${PROXY_HEADER_KEY_2}:${PROXY_HEADER_VALUE_2}`,
    ]);
  });
});
