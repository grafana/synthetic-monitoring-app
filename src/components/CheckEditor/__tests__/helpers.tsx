import React from 'react';
import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckType, CheckTypeGroup, ROUTES } from 'types';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { PLUGIN_URL_PATH } from 'components/constants';

import { selectOption } from '../testHelpers';

interface FillMandatoryFieldsOptions {
  user: UserEvent;
  fieldsToOmit?: Array<'job' | 'target' | 'probes'>;
  checkType: CheckType;
}

export const TARGET_MAP = {
  [CheckType.DNS]: 'grafana.com',
  [CheckType.GRPC]: 'grafana.com:50051',
  [CheckType.HTTP]: 'https://grafana.com/',
  [CheckType.MULTI_HTTP]: '',
  [CheckType.PING]: 'grafana.com',
  [CheckType.Scripted]: 'Whatever string we would like',
  [CheckType.TCP]: 'grafana.com:80',
  [CheckType.Traceroute]: 'grafana.com',
};

export async function renderForm(checkType: CheckType) {
  const { record, read } = getServerRequests();
  server.use(apiRoute(`addCheck`, {}, record));

  const res = render(<CheckForm />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkTypeGroup`,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckTypeGroup.ApiTest}?checkType=${checkType}`,
  });

  await screen.findByText('Submit');

  return {
    ...res,
    read,
  };
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
    await selectOption(user, { label: 'Probe locations', option: PRIVATE_PROBE.name });
  }
}

export async function goToSection(user: UserEvent, sectionIndex: 1 | 2 | 3 | 4 | 5) {
  const formSidebar = await screen.findByTestId('form-sidebar');
  const buttons = formSidebar.querySelectorAll('button');

  const targetButton = buttons[sectionIndex - 1];

  await user.click(targetButton);
}

export async function submitForm(user: UserEvent) {
  const saveButton = await screen.findByText('Submit');
  await user.click(saveButton);
}
