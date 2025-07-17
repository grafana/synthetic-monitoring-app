import { CheckType } from 'types';
import { goToSectionV2, renderNewForm, selectBasicFrequency, submitForm } from 'page/__testHelpers__/checkForm';

import { FormStepOrder } from '../../../../../components/CheckForm/constants';
import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 5 (Execution) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const TWO_MINUTES_IN_MS = 2 * 60 * 1000;

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.frequency).toBe(TWO_MINUTES_IN_MS);
  });

  it(`can add probe frequency`, async () => {
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSectionV2(user, FormStepOrder.Execution);

    await selectBasicFrequency(user, '5m');

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(FIVE_MINUTES_IN_MS);
  });
});
