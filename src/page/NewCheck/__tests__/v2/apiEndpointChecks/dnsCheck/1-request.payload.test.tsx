import { screen } from '@testing-library/react';

import { CheckType, DnsProtocol, DnsRecordType, IpVersion } from 'types';
import {
  selectComboboxOption,
  selectRadioGroupOption,
  submitForm,
} from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.settings.dns.ipVersion).toBe(IpVersion.V4);
    expect(body.settings.dns.recordType).toBe(DnsRecordType.A);
    expect(body.settings.dns.server).toBe(`dns.google`);
    expect(body.settings.dns.protocol).toBe(DnsProtocol.UDP);
    expect(body.settings.dns.port).toBe(53);
  });

  it(`can add request target`, async () => {
    const REQUEST_TARGET = `example.com`;

    const { read, user } = await renderNewFormV2(checkType);
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

      const { read, user } = await renderNewFormV2(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByLabelText('IPv6'));

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.dns.ipVersion).toBe(IP_VERSION);
    });
  });

  describe(`DNS Settings`, () => {
    it(`can change the record type`, async () => {
      const RECORD = DnsRecordType.AAAA;

      const { read, user } = await renderNewFormV2(checkType);
      await user.click(screen.getByText('Request options'));

      await selectComboboxOption(user, screen.getByLabelText('Record type'), new RegExp(RECORD));

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.dns.recordType).toBe(RECORD);
    });

    it(`can change the server`, async () => {
      const SERVER = `different.server`;

      const { read, user } = await renderNewFormV2(checkType);
      await user.click(screen.getByText('Request options'));

      const serverInput = screen.getByLabelText(/Server \*/);
      await user.clear(serverInput);
      await user.type(serverInput, SERVER);

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.dns.server).toBe(SERVER);
    });

    it(`can change the protocol type`, async () => {
      const PROTOCOL = DnsProtocol.TCP;

      const { read, user } = await renderNewFormV2(checkType);
      await user.click(screen.getByText('Request options'));
      await selectRadioGroupOption(user, 'Protocol', PROTOCOL);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.dns.protocol).toBe(PROTOCOL);
    });

    it(`can change the port`, async () => {
      const PORT = 54;

      const { read, user } = await renderNewFormV2(checkType);
      await user.click(screen.getByText('Request options'));

      const portInput = screen.getByLabelText(/Port \*/);
      await user.clear(portInput);
      await user.type(portInput, String(PORT));

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.dns.port).toBe(PORT);
    });
  });
});
