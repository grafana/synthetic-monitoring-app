import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { selectOption } from 'test/utils';

import { Check, CheckType } from 'types';
import {
  FALLBACK_CHECK_DNS,
  FALLBACK_CHECK_GRPC,
  FALLBACK_CHECK_HTTP,
  FALLBACK_CHECK_PING,
  FALLBACK_CHECK_TCP,
  FALLBACK_CHECK_TRACEROUTE,
} from 'components/constants';

import { goToSection, TARGET_MAP } from './checkForm';

interface FillMandatoryFieldsOptions {
  user: UserEvent;
  fieldsToOmit?: Array<'job' | 'target' | 'probes'>;
  checkType: CheckType;
}

export const FALLBACK_CHECK_MAP: Record<string, Check> = {
  [CheckType.HTTP]: FALLBACK_CHECK_HTTP,
  [CheckType.PING]: FALLBACK_CHECK_PING,
  [CheckType.GRPC]: FALLBACK_CHECK_GRPC,
  [CheckType.DNS]: FALLBACK_CHECK_DNS,
  [CheckType.TCP]: FALLBACK_CHECK_TCP,
  [CheckType.Traceroute]: FALLBACK_CHECK_TRACEROUTE,
};

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
    await selectOption(user, { label: 'Probe locations', option: PRIVATE_PROBE.name });
  }
}
