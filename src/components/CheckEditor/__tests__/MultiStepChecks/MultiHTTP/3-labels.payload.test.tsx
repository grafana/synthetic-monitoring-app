import { screen } from '@testing-library/react';

import { CheckType } from 'types';

import { goToSection, renderNewForm, submitForm } from '../../../__testHelpers__/checkForm';
import { fillMandatoryFields } from '../../../__testHelpers__/multiStep';

const checkType = CheckType.MULTI_HTTP;

describe(`MultiHTTPCheck - Section 3 (Labels) payload`, () => {
  it(`can submit the form with labels filled in`, async () => {
    const LABEL_KEY_1 = 'label1';
    const LABEL_VALUE_1 = 'value1';
    const LABEL_KEY_2 = 'label2';
    const LABEL_VALUE_2 = 'value2';

    const { user, read } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 3);

    const addLabelButton = screen.getByText('Add Label', { exact: false });
    await user.click(addLabelButton);

    await user.type(screen.getByLabelText('label 1 name'), LABEL_KEY_1);
    await user.type(screen.getByLabelText('label 1 value'), LABEL_VALUE_1);

    await user.click(addLabelButton);
    await user.type(screen.getByLabelText('label 2 name'), LABEL_KEY_2);
    await user.type(screen.getByLabelText('label 2 value'), LABEL_VALUE_2);

    await submitForm(user);

    const { body } = await read();

    expect(body.labels).toEqual([
      { name: LABEL_KEY_1, value: LABEL_VALUE_1 },
      { name: LABEL_KEY_2, value: LABEL_VALUE_2 },
    ]);
  });
});
