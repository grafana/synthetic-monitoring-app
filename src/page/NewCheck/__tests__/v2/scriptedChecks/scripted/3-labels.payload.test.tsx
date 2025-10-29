import { screen } from '@testing-library/react';

import { FormSectionName } from '../../../../../../components/Checkster/types';
import { CheckType } from 'types';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.Scripted;

describe(`ScriptedCheck - Section 3 (Labels) payload`, () => {
  it(`can submit the form with labels filled in`, async () => {
    const LABEL_KEY_1 = 'label1';
    const LABEL_VALUE_1 = 'value1';
    const LABEL_KEY_2 = 'label2';
    const LABEL_VALUE_2 = 'value2';

    const { user, read } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await gotoSection(user, FormSectionName.Labels);

    const addLabelButton = screen.getByRole('button', { name: 'Label' });
    await user.click(addLabelButton);

    await user.type(screen.getByLabelText('Custom labels 1 name'), LABEL_KEY_1);
    await user.type(screen.getByLabelText('Custom labels 1 value'), LABEL_VALUE_1);

    await user.click(addLabelButton);
    await user.type(screen.getByLabelText('Custom labels 2 name'), LABEL_KEY_2);
    await user.type(screen.getByLabelText('Custom labels 2 value'), LABEL_VALUE_2);

    await submitForm(user);

    const { body } = await read();

    expect(body.labels).toEqual([
      { name: LABEL_KEY_1, value: LABEL_VALUE_1 },
      { name: LABEL_KEY_2, value: LABEL_VALUE_2 },
    ]);
  });
});
