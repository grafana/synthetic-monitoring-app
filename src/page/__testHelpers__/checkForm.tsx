import React from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { DataTestIds } from 'test/dataTestIds';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { Check, CheckType, ROUTES } from 'types';
import { getCheckTypeGroup } from 'utils';
import { EditCheck } from 'page/EditCheck';
import { NewCheck } from 'page/NewCheck';

import { getRoute } from '../../components/Routing.utils';
import { generateRoutePath } from '../../routes';

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
    path: `${generateRoutePath(ROUTES.NewCheck)}/${checkTypeGroup}?checkType=${checkType}`,
    route: `${getRoute(ROUTES.NewCheck)}/:checkTypeGroup`,
  });

  await waitFor(async () => await screen.findByTestId(DataTestIds.PAGE_READY), { timeout: 10000 });

  const typeButReallyPaste = async (target: Element, value: string, args?: any) => {
    if (target instanceof HTMLElement) {
      await act(() => {
        target.focus();
      });
      await res.user.paste(value);
    }
  };

  const user: UserEvent = {
    ...res.user,
    type: typeButReallyPaste,
  };

  return {
    ...res,
    read,
    user,
  };
}

export async function renderEditForm(id: Check['id']) {
  const { record, read } = getServerRequests();
  server.use(apiRoute(`updateCheck`, {}, record));

  if (!Number.isInteger(id)) {
    throw new Error('id must be an integer');
  }

  const res = render(<EditCheck />, {
    route: ROUTES.EditCheck,
    path: generateRoutePath(ROUTES.EditCheck, { id: id! }),
  });

  await waitFor(async () => screen.getByTestId('page-ready'), { timeout: 10000 });

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
  const saveButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
  await user.click(saveButton);
}

export async function testCheck(user: UserEvent) {
  const actionsBar = screen.getByTestId(DataTestIds.ACTIONS_BAR);
  const testButton = await within(actionsBar).findByText('Test');
  await user.click(testButton);
}
