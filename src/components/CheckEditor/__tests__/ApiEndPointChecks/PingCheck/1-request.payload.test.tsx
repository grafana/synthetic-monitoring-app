import { screen } from '@testing-library/react';

import { CheckType, IpVersion } from 'types';
import { fillMandatoryFields, renderForm, submitForm } from 'components/CheckEditor/__tests__/helpers';
import { selectOption } from 'components/CheckEditor/testHelpers';

const checkType = CheckType.PING;

describe(`PingCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderForm(checkType);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.ping.ipVersion).toBe(IpVersion.V4);
  });

  it(`can add request target`, async () => {
    const REQUEST_TARGET = `example.com`;

    const { read, user } = await renderForm(checkType);
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

      const { read, user } = await renderForm(checkType);
      await user.click(screen.getByText('Request options'));
      await selectOption(user, { label: 'IP version', option: IP_VERSION });

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.ping.ipVersion).toBe(IP_VERSION);
    });

    it(`can submit the don't fragment option`, async () => {
      const { read, user } = await renderForm(checkType);

      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByLabelText(`Don't fragment`, { exact: false }));

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.ping.dontFragment).toBe(true);
    });
  });
});
