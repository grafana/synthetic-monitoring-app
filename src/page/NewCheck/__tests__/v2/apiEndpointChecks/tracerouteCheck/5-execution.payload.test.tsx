import { FormSectionName } from '../../../../../../components/Checkster/types';
import { CheckType } from 'types';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2, selectBasicFrequency } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 5 (Execution) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const TWO_MINUTES_IN_MS = 2 * 60 * 1000;

    const { read, user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.frequency).toBe(TWO_MINUTES_IN_MS);
  });

  it(`can add probe frequency`, async () => {
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

    const { user, read } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await gotoSection(user, FormSectionName.Execution);

    await selectBasicFrequency(user, '5m');

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(FIVE_MINUTES_IN_MS);
  });
});
