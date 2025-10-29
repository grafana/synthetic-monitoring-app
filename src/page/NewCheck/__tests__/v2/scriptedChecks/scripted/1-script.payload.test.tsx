import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.Scripted;

describe(`ScriptedCheck - 1 (Script) payload`, () => {
  it(`can add a job name`, async () => {
    const JOB_NAME = `scripted job name`;

    const { read, user } = await renderNewFormV2(checkType);
    await user.type(screen.getByLabelText(`Job name`, { exact: false }), JOB_NAME);
    await fillMandatoryFields({ user, fieldsToOmit: [`job`], checkType });

    await submitForm(user);

    const { body } = await read();

    expect(body.job).toBe(JOB_NAME);
  });

  it(`can add an instance`, async () => {
    const INSTANCE = `a lovely instance`;

    const { read, user } = await renderNewFormV2(checkType);
    await user.type(screen.getByLabelText(`Instance`, { exact: false }), INSTANCE);
    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });

    await submitForm(user);

    const { body } = await read();

    expect(body.target).toBe(INSTANCE);
  });

  it.skip(`can add a script`, async () => {
    // it uses MonacoEditor, which is not supported by the current testing setup
  });
});
