import { CheckType } from 'types';
import { fillMandatoryFields, renderForm, submitForm } from 'components/CheckEditor/__tests__/helpers';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const THIRTY_SECONDS_IN_MS = 30 * 1000;
    const { read, user } = await renderForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.timeout).toBe(THIRTY_SECONDS_IN_MS);
  });
});
