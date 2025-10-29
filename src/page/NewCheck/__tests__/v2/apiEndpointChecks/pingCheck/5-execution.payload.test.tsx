import { FormSectionName } from '../../../../../../components/Checkster/types';
import { CheckType } from 'types';
import { renderNewFormV2, selectBasicFrequency } from 'page/__testHelpers__/checkForm';

import { gotoSection, submitForm } from '../../../../../../components/Checkster/__testHelpers__/formHelpers';
import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.HTTP;

describe(`PingCheck - Section 5 (Execution) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const ONE_MINUTE_IN_MS = 60 * 1000;

    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.frequency).toBe(ONE_MINUTE_IN_MS);
  });

  it(`can add probe frequency`, async () => {
    const { user, read } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await gotoSection(user, FormSectionName.Execution);

    await selectBasicFrequency(user, '30s');

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(30000);
  });
});
