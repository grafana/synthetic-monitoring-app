import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSection, renderNewForm, selectBasicFrequency, submitForm } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../__testHelpers__/multiStep';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 5 (Execution) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.frequency).toBe(FIVE_MINUTES_IN_MS);
  });

  it(`can add probe frequency`, async () => {
    const TWO_MINUTES_IN_MS = 2 * 60 * 1000;

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 5);

    await selectBasicFrequency(user, '2m');

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(TWO_MINUTES_IN_MS);
  });

  it(`can add timeout up to 180 seconds`, async () => {
    const MAX_TIMEOUT_MS = 180000;

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 2);

    const timeoutMinutesInput = screen.getByLabelText('timeout minutes input');
    const timeoutSecondsInput = screen.getByLabelText('timeout seconds input');

    await user.clear(timeoutMinutesInput);
    await user.clear(timeoutSecondsInput);
    await user.type(timeoutMinutesInput, `{backspace}1`);
    await user.type(timeoutSecondsInput, `30`);

    await submitForm(user);

    const { body } = await read();

    expect(body.timeout).toBe(MAX_TIMEOUT_MS);
  });
});
