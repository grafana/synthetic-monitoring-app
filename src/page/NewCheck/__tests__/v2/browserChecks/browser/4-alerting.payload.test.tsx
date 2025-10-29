import { selectOption } from 'test/utils';

import { AlertSensitivity, CheckType } from 'types';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.Browser;

describe(`BrowserCheck - Section 4 (alerting)`, () => {
  it(`can submit the form with alerting filled in`, async () => {
    const { user, read } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });

    await gotoSection(user, FormSectionName.Alerting);
    await selectOption(user, { label: `Select alert sensitivity`, option: `Medium` });

    await submitForm(user);

    const { body } = await read();

    expect(body.alertSensitivity).toBe(AlertSensitivity.Medium);
  });
});
