import { CheckType } from 'types';
import { goToSection, renderNewForm, selectBasicFrequency, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 5 (Execution) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const ONE_MINUTE_IN_MS = 60 * 1000;

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.frequency).toBe(ONE_MINUTE_IN_MS);
  });

  it(`can add probe frequency`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 5);

    await selectBasicFrequency(user, '30s');

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(30000);
  });
});
