import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { probeToMetadataProbe } from 'test/utils';

import { CheckType } from 'types';

import { FormSectionIndex } from '../../components/CheckForm/constants';
import { goToSectionV2, TARGET_MAP } from './checkForm';

interface FillMandatoryFieldsOptions {
  user: UserEvent;
  fieldsToOmit?: Array<'job' | 'target' | 'probes'>;
  checkType: CheckType;
}

export async function fillMandatoryFields({ user, fieldsToOmit = [], checkType }: FillMandatoryFieldsOptions) {
  await goToSectionV2(user, FormSectionIndex.Check);

  if (!fieldsToOmit.includes('job')) {
    const jobNameInput = screen.getByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `MANDATORY JOB NAME`);
  }

  if (!fieldsToOmit.includes('target')) {
    const targetInput = screen.getByLabelText(`Instance`, { exact: false });
    await user.type(targetInput, TARGET_MAP[checkType]);
  }

  await goToSectionV2(user, FormSectionIndex.Execution);

  if (!fieldsToOmit.includes('probes')) {
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
    await user.click(probeCheckbox);
  }
}
