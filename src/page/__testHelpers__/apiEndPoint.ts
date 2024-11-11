import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { PRIVATE_PROBE } from 'test/fixtures/probes';

import { CheckType } from 'types';

import { goToSection, TARGET_MAP } from './checkForm';

interface FillMandatoryFieldsOptions {
  user: UserEvent;
  fieldsToOmit?: Array<'job' | 'target' | 'probes'>;
  checkType: CheckType;
}

export async function fillMandatoryFields({ user, fieldsToOmit = [], checkType }: FillMandatoryFieldsOptions) {
  await goToSection(user, 1);

  if (!fieldsToOmit.includes('job')) {
    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `MANDATORY JOB NAME`);
  }

  if (!fieldsToOmit.includes('target')) {
    const targetInput = await screen.getByPlaceholderText(TARGET_MAP[checkType]);
    await user.type(targetInput, TARGET_MAP[checkType]);
  }

  await goToSection(user, 5);

  if (!fieldsToOmit.includes('probes')) {
    const probeCheckbox = await screen.findByLabelText(PRIVATE_PROBE.name);
    await user.click(probeCheckbox);
  }
}
