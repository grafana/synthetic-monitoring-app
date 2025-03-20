import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

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
    await goToSection(user, 5);

    await screen.getByRole('radio', { name: '5m' }).click();

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(FIVE_MINUTES_IN_MS);
  });
});
