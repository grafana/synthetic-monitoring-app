import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const THIRTY_SECONDS_IN_MS = 30 * 1000;
    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.timeout).toBe(THIRTY_SECONDS_IN_MS);
  });
});
