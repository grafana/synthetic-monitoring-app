import { screen } from '@testing-library/dom';
import { BASIC_SCRIPTED_CHECK } from 'test/fixtures/checks';

import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderDuplicateFormV2 } from 'page/__testHelpers__/checkForm';

async function renderDuplicateCheck() {
  return renderDuplicateFormV2(BASIC_SCRIPTED_CHECK, CheckType.HTTP);
}

describe('DuplicateCheck', () => {
  it('should be able to change the job name', async () => {
    const { read, user } = await renderDuplicateCheck();
    const JOB_NAME = 'JOB NAME';

    const jobField = screen.getByLabelText(/Job name/);
    expect(jobField).toHaveValue(`${BASIC_SCRIPTED_CHECK.job} (Copy)`);
    await user.clear(jobField);
    await user.type(jobField, JOB_NAME);
    await submitForm(user);

    const { body } = await read();

    const { alerts, id, created, modified, ...rest } = BASIC_SCRIPTED_CHECK;

    expect(body).toEqual({ ...rest, job: JOB_NAME });
  });
});
