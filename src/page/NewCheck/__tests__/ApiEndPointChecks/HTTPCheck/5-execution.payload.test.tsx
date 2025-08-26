import { CheckType } from 'types';
import { goToSectionV2, renderNewForm, selectBasicFrequency, submitForm } from 'page/__testHelpers__/checkForm';

import { FormSectionIndex } from '../../../../../components/CheckForm/constants';
import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 5 (Execution) payload`, () => {
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
    await goToSectionV2(user, FormSectionIndex.Execution);

    await selectBasicFrequency(user, '30s');

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(30000);
  });
});
