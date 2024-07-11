import { screen } from '@testing-library/react';
import { VALID_CERT, VALID_KEY } from 'test/fixtures/checks';

import { CheckType, IpVersion } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';
import { selectOption } from 'test/utils';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.GRPC;

describe(`gRPCCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.settings.grpc.ipVersion).toBe(IpVersion.V4);
  });

  it(`can add request target`, async () => {
    const REQUEST_TARGET = `example.com:50051`;

    const { read, user } = await renderNewForm(checkType);
    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    await user.type(targetInput, REQUEST_TARGET);

    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.target).toBe(REQUEST_TARGET);
  });

  describe(`Request options`, () => {
    it(`can submit the IP version`, async () => {
      const IP_VERSION = IpVersion.V6;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await selectOption(user, { label: 'IP version', option: IP_VERSION });

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.grpc.ipVersion).toBe(IP_VERSION);
    });
  });

  describe(`Service`, () => {
    it(`can add a service`, async () => {
      const SERVICE = `service`;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('Service'));

      const serviceInput = screen.getByLabelText('Service', { selector: `input`, exact: false });
      await user.type(serviceInput, SERVICE);

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.grpc.service).toBe(SERVICE);
    });
  });

  describe(`TLS Config`, () => {
    it(`can turn off if TLS is used`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));

      await user.click(screen.getByLabelText('Use TLS', { exact: false }));
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.grpc.tls).toBe(true);
    });

    it(`can disable target certificate validation`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));

      await user.click(screen.getByLabelText('Disable target certificate validation'));
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.grpc.tlsConfig.insecureSkipVerify).toBe(true);
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
      expect(body.settings.grpc.tlsConfig.serverName).toBe(SERVER_NAME);
    });

    it(`can add CA certificate`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));
      await user.type(screen.getByLabelText('CA certificate', { exact: false }), VALID_CERT);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.grpc.tlsConfig.caCert).toBe(btoa(VALID_CERT));
    });

    it(`can add Client certificate`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));
      await user.type(screen.getByLabelText('Client certificate', { exact: false }), VALID_CERT);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.grpc.tlsConfig.clientCert).toBe(btoa(VALID_CERT));
    });

    it(`can add Client key`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));
      await user.type(screen.getByLabelText('Client key', { exact: false }), VALID_KEY);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.grpc.tlsConfig.clientKey).toBe(btoa(VALID_KEY));
    });
  });
});
