import { screen } from '@testing-library/react';
import { selectOption } from 'test/utils';

import { AlertSensitivity, CheckType } from 'types';

import { goToSection, renderNewForm, submitForm } from '../../../../__testHelpers__/checkForm';
import { fillMandatoryFields } from '../../../../__testHelpers__/scripted';

const checkType = CheckType.Scripted;

describe(`ScriptedCheck - Section 5 (Alerting)`, () => {
  it(`can submit the form with alerting filled in`, async () => {
    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });

    await goToSection(user, 5);
    
    await user.click(screen.getByText('Legacy alerts'));
    
    await selectOption(user, { label: `Select alert sensitivity`, option: `Medium` });

    await submitForm(user);

    const { body } = await read();

    expect(body.alertSensitivity).toBe(AlertSensitivity.Medium);
  });
});
