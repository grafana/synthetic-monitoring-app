import React from 'react';
import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { DataTestIds } from 'test/dataTestIds';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { Check, CheckType, ROUTES } from 'types';
import { getCheckType, getCheckTypeGroup } from 'utils';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';
import { EditCheck } from 'page/EditCheck';
import { NewCheck } from 'page/NewCheck';

export const TARGET_MAP = {
  [CheckType.DNS]: 'grafana.com',
  [CheckType.GRPC]: 'grafana.com:50051',
  [CheckType.HTTP]: 'https://grafana.com/',
  [CheckType.MULTI_HTTP]: 'https://grafana.com/',
  [CheckType.PING]: 'grafana.com',
  [CheckType.Scripted]: 'Whatever string we would like',
  [CheckType.Browser]: 'Whatever string we would like',
  [CheckType.TCP]: 'grafana.com:80',
  [CheckType.Traceroute]: 'grafana.com',
};

export async function renderNewForm(checkType: CheckType) {
  const { record, read } = getServerRequests();
  server.use(apiRoute(`addCheck`, {}, record));
  const checkTypeGroup = getCheckTypeGroup(checkType);

  const res = render(<NewCheck />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.NewCheck}/:checkTypeGroup`,
    path: `${PLUGIN_URL_PATH}${ROUTES.NewCheck}/${checkTypeGroup}?checkType=${checkType}`,
  });

  await screen.findByTestId(DataTestIds.PAGE_READY);

  return {
    ...res,
    read,
  };
}

export async function renderEditForm(check: Pick<Check, 'id' | 'settings'>) {
  const { record, read } = getServerRequests();
  server.use(apiRoute(`updateCheck`, {}, record));
  const checkType = getCheckType(check.settings);
  const checkTypeGroup = getCheckTypeGroup(checkType);

  const res = render(<EditCheck />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.EditCheck}/edit/:checkTypeGroup/:id`,
    path: `${PLUGIN_URL_PATH}${ROUTES.EditCheck}/edit/${checkTypeGroup}/${check.id}`,
  });

  await screen.findByText(/^Editing/);

  return {
    ...res,
    read,
  };
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

export async function testCheck(user: UserEvent) {
  const actionsBar = screen.getByTestId(DataTestIds.ACTIONS_BAR);
  const testButton = await within(actionsBar).findByText('Test');
  await user.click(testButton);
}
