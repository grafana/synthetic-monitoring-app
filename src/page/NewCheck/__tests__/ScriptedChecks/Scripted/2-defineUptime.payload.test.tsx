import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSectionV2, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { FormSectionIndex } from '../../../../../components/CheckForm/constants';
import { fillMandatoryFields } from '../../../../__testHelpers__/scripted';

const checkType = CheckType.Scripted;

describe(`ScriptedCheck - Section 2 (Define uptime) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const FIFTEEN_SECONDS_IN_MS = 15 * 1000;
    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.timeout).toBe(FIFTEEN_SECONDS_IN_MS);
  });

  it(`can set the timeout`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSectionV2(user, FormSectionIndex.Uptime);

    const minutesInput = screen.getByLabelText('timeout minutes input');
    const secondsInput = screen.getByLabelText('timeout seconds input');
    await user.type(minutesInput, '1');
    await user.clear(secondsInput);

    await submitForm(user);

    const { body } = await read();

    expect(body.timeout).toBe(60000);
  });
});
