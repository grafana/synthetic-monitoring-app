import { screen } from '@testing-library/react';
import { VALID_CERT, VALID_KEY } from 'test/fixtures/checks';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) Request Options payload`, () => {
  it(`can disable target certificate validation`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));

    await user.click(screen.getByLabelText('Disable target certificate validation'));
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.tlsConfig.insecureSkipVerify).toBe(true);
  });

  it(`can add server name`, async () => {
    const SERVER_NAME = `server.com`;

    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));

    await user.type(screen.getByLabelText('Server name', { exact: false }), SERVER_NAME);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.tlsConfig.serverName).toBe(SERVER_NAME);
  });

  it(`can add CA certificate`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));
    await user.type(screen.getByLabelText('CA certificate', { exact: false }), VALID_CERT);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.tlsConfig.caCert).toBe(btoa(VALID_CERT));
  });

  it(`can add Client certificate`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));
    await user.type(screen.getByLabelText('Client certificate', { exact: false }), VALID_CERT);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.tlsConfig.clientCert).toBe(btoa(VALID_CERT));
  });

  it(`can add Client key`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('TLS Config'));
    await user.type(screen.getByLabelText('Client key', { exact: false }), VALID_KEY);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.tlsConfig.clientKey).toBe(btoa(VALID_KEY));
  });
});
