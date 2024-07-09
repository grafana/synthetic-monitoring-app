import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { fillMandatoryFields, goToSection, renderForm, submitForm } from 'components/CheckEditor/__tests__/helpers';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 5 (Execution) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const ONE_MINUTE_IN_MS = 60 * 1000;

    const { read, user } = await renderForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await submitForm(user);
    const { body } = await read();

    expect(body.frequency).toBe(ONE_MINUTE_IN_MS);
  });

  it(`can add probe frequency`, async () => {
    const { user, read } = await renderForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 5);

    const minutesInput = screen.getByLabelText('frequency minutes input');
    const secondsInput = screen.getByLabelText('frequency seconds input');
    await user.clear(minutesInput);
    await user.clear(secondsInput);
    await user.type(secondsInput, '30');

    await submitForm(user);

    const { body } = await read();

    expect(body.frequency).toBe(30000);
  });
});
