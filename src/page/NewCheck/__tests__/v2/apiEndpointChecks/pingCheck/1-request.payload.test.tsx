import { screen } from '@testing-library/react';

import { CheckType, IpVersion } from 'types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { submitForm } from '../../../../../../components/Checkster/__testHelpers__/formHelpers';
import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.PING;

describe(`PingCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderNewFormV2(checkType);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.ping.ipVersion).toBe(IpVersion.V4);
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
      expect(body.settings.ping.ipVersion).toBe(IP_VERSION);
    });

    it(`can submit the don't fragment option`, async () => {
      const { read, user } = await renderNewFormV2(checkType);

      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByLabelText('Do not fragment', { exact: false }));

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.ping.dontFragment).toBe(true);
    });
  });
});
