import { selectOption } from 'test/utils';

import { AlertSensitivity, CheckType } from 'types';

import { goToSection, renderNewForm, submitForm } from '../../../../__testHelpers__/checkForm';
import { fillMandatoryFields } from '../../../../__testHelpers__/scripted';

const checkType = CheckType.Scripted;

describe(`ScriptedCheck - Section 4 (alerting)`, () => {
  it(`can submit the form with alerting filled in`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 4);
    await selectOption(user, { label: `Select alert sensitivity`, option: `Medium` });

    await submitForm(user);

    const { body } = await read();

    expect(body.alertSensitivity).toBe(AlertSensitivity.Medium);
  });
});
