import React from 'react';
import { config } from '@grafana/runtime';
import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { BASIC_CHECK_LIST, BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { Check, FeatureName, ROUTES } from 'types';
import { getSelect, selectOption } from 'components/CheckEditor/testHelpers';
import { PLUGIN_URL_PATH } from 'components/constants';

import { CheckList } from './CheckList';

jest.mock('hooks/useNavigation', () => {
  const actual = jest.requireActual('hooks/useNavigation');
  return {
    __esModule: true,
    ...actual,
  };
});
const useNavigationHook = require('hooks/useNavigation');

jest.setTimeout(20000);

const renderCheckList = async (checks = BASIC_CHECK_LIST) => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: checks,
        };
      },
    })
  );

  const res = render(<CheckList />, {
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
  });

  await waitFor(() => expect(screen.getByText('Add new check')).toBeInTheDocument());
  return res;
};

beforeEach(() => {
  localStorage.clear();
});

test('renders empty state', async () => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: [],
        };
      },
    })
  );

  await render(<CheckList />, {
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
  });
  const emptyWarning = await screen.findByText('This account does not currently have any checks configured', {
    exact: false,
  });
  expect(emptyWarning).toBeInTheDocument();
});

test('renders list of checks', async () => {
  await renderCheckList();
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(BASIC_CHECK_LIST.length);
});

test('search by text', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  filterInput.focus();

  await user.paste(BASIC_DNS_CHECK.job);
  const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search is case insensitive', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
  filterInput.focus();

  await user.paste(BASIC_DNS_CHECK.job.toUpperCase());
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches target value', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
  filterInput.focus();

  await user.paste(BASIC_DNS_CHECK.target);
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches label value', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
  filterInput.focus();

  await user.paste(BASIC_DNS_CHECK.labels[0].name);
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches label value', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
  filterInput.focus();

  await user.paste(BASIC_DNS_CHECK.labels[0].value);
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('clicking label value adds to label filter', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const label = BASIC_DNS_CHECK.labels[0];
  const constructedLabel = `${label.name}: ${label.value}`;
  const labelValue = await screen.findAllByText(constructedLabel);
  await user.click(labelValue[0]);
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);

  const dialog = getModalContainer();
  expect(within(dialog).getByText(constructedLabel)).toBeInTheDocument();
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by check type', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);

  await selectOption(user, { label: 'Filter by type', option: 'HTTP' });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by probe', async () => {
  const DNS_CHECK_WITH_REMOVED_PROBE: Check = {
    ...BASIC_DNS_CHECK,
    probes: [PUBLIC_PROBE.id] as number[],
  };

  const { user } = await renderCheckList([DNS_CHECK_WITH_REMOVED_PROBE, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);
  const probeFilter = await screen.findByLabelText('Filter by probe');
  await user.click(probeFilter);
  await user.click(screen.getByText(PRIVATE_PROBE.name, { selector: 'span' }));

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('loads search from localStorage', async () => {
  localStorage.setItem(
    'checkFilters',
    JSON.stringify({
      search: BASIC_DNS_CHECK.job,
      labels: [],
      type: 'all',
      status: { label: 'All', value: 0 },
      probes: [],
    })
  );
  await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const searchInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  expect(searchInput).toHaveValue(BASIC_DNS_CHECK.job);

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('loads status filter from localStorage', async () => {
  const filters = {
    search: '',
    labels: [],
    type: 'all',
    status: { label: 'Disabled', value: 2 },
    probes: [],
  };

  localStorage.setItem('checkFilters', JSON.stringify(filters));

  const DNS_CHECK_DISABLED = {
    ...BASIC_DNS_CHECK,
    enabled: false,
  };

  const { user } = await renderCheckList([DNS_CHECK_DISABLED, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);

  const dialog = getModalContainer();
  const statusFilter = await within(dialog).findByText(filters.status.label);
  expect(statusFilter).toBeInTheDocument();
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('loads type filter from localStorage', async () => {
  const filters = {
    search: '',
    labels: [],
    type: 'http',
    status: { label: 'All', value: 0 },
    probes: [],
  };

  localStorage.setItem('checkFilters', JSON.stringify(filters));
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByText(/Additional filters \(1 active\)/i);
  await user.click(additionalFilters);

  const dialog = getModalContainer();
  const typeFilter = await within(dialog).findByText(filters.type, { exact: false });
  expect(typeFilter).toBeInTheDocument();

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('loads labels from localStorage', async () => {
  const label = BASIC_DNS_CHECK.labels[0];
  const constructedLabel = `${label.name}: ${label.value}`;

  const filters = {
    search: '',
    labels: [constructedLabel],
    type: 'all',
    status: { label: 'All', value: 0 },
    probes: [],
  };

  localStorage.setItem('checkFilters', JSON.stringify(filters));
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByText(/Additional filters \(1 active\)/i);
  await user.click(additionalFilters);

  const dialog = getModalContainer();
  const typeFilter = await within(dialog).findByText(constructedLabel, { exact: false });
  expect(typeFilter).toBeInTheDocument();

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('clicking type chiclet adds it to filter', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const httpTypeChiclet = await screen.findAllByText('HTTP');
  await user.click(httpTypeChiclet[0]);
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);
  const checks = await screen.findAllByTestId('check-card');

  const dialog = getModalContainer();
  const typeFilter = await within(dialog).findByText(`HTTP`);
  expect(typeFilter).toBeInTheDocument();

  expect(checks.length).toBe(1);
});

test('clicking status chiclet adds it to filter', async () => {
  const DNS_CHECK_DISABLED = {
    ...BASIC_DNS_CHECK,
    enabled: false,
  };

  const { user } = await renderCheckList([DNS_CHECK_DISABLED, BASIC_HTTP_CHECK]);
  const disabledChiclet = await screen.findAllByText('Disabled');
  await user.click(disabledChiclet[0]);
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);

  const dialog = getModalContainer();
  const statusFilter = await within(dialog).findByText(`Disabled`);
  expect(statusFilter).toBeInTheDocument();

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('clicking add new is handled', async () => {
  const navigate = jest.fn();
  useNavigationHook.useNavigation = jest.fn(() => navigate); // TODO: COME BACK TO
  const { user } = await renderCheckList();
  const addNewButton = await screen.findByText('Add new check');
  await user.click(addNewButton);
  expect(navigate).toHaveBeenCalledWith(ROUTES.ChooseCheckType);
});

test('cascader adds labels to label filter', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);
  const cascader = await screen.findByText('Labels');
  await user.click(cascader);
  const labelMenuItems = await screen.findAllByLabelText('Select check');
  expect(labelMenuItems.length).toBe(2);
  const labelName = await screen.findByText(BASIC_DNS_CHECK.labels[0].name);
  await user.click(labelName);
  const labelValue = await screen.findByText(BASIC_DNS_CHECK.labels[0].value);
  await user.click(labelValue);

  const constructedLabel = `${BASIC_DNS_CHECK.labels[0].name}: ${BASIC_DNS_CHECK.labels[0].value}`;
  const dialog = getModalContainer();
  const labelFilterInput = await within(dialog).findByText(constructedLabel);

  expect(labelFilterInput).toBeInTheDocument();
});

test('Sorting by success rate should not crash', async () => {
  const { user } = await renderCheckList();
  const sortPicker = await screen.getByLabelText('Sort checks by');
  await user.click(sortPicker);
  await user.click(screen.getByText(`Asc. Reachability`, { selector: 'span' }));

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(BASIC_CHECK_LIST.length);
});

test(`Scripted checks do not appear in the filters by default`, async () => {
  const { user } = await renderCheckList();
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);

  const select = await getSelect({ label: `Filter by type` });
  await user.click(select[0]);
  const listBox = screen.getByLabelText(`Select options menu`);

  expect(within(listBox).queryByText(`Scripted`)).not.toBeInTheDocument();
});

test(`Scripted checks appear in the filters when the feature flag is enabled`, async () => {
  jest.replaceProperty(config, 'featureToggles', {
    // @ts-expect-error
    [FeatureName.ScriptedChecks]: true,
  });

  const { user } = await renderCheckList();
  const additionalFilters = await screen.findByText(/Additional filters/i);
  await user.click(additionalFilters);

  const select = await getSelect({ label: `Filter by type` });
  await user.click(select[0]);
  const listBox = screen.getByLabelText(`Select options menu`);

  expect(within(listBox).getByText(`Scripted`)).toBeInTheDocument();
});

describe(`bulk select behaviour`, () => {
  test('select all performs disable action on all visible checks', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`bulkUpdateChecks`, {}, record));

    const checkList = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK];
    const { user } = await renderCheckList(checkList);
    const selectAll = await screen.findByTestId('selectAll');
    await user.click(selectAll);
    const selectedText = await screen.findByText(`${checkList.length} checks are selected.`);
    expect(selectedText).toBeInTheDocument();
    const disableButton = await screen.findByText('Disable');

    await user.click(disableButton);

    const { body } = await read();

    expect(body).toEqual(
      [BASIC_DNS_CHECK, BASIC_HTTP_CHECK].map((check) => ({
        ...check,
        enabled: false,
      }))
    );
  });

  test('select all performs enable action on all visible checks', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`bulkUpdateChecks`, {}, record));

    const checkList = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK].map((check) => ({
      ...check,
      enabled: false,
    }));
    const { user } = await renderCheckList(checkList);
    const selectAll = await screen.findByTestId('selectAll');
    await user.click(selectAll);
    const selectedText = await screen.findByText(`${checkList.length} checks are selected.`);
    expect(selectedText).toBeInTheDocument();
    const enableButton = await screen.findByText('Enable');
    await user.click(enableButton);

    const { body } = await read();

    expect(body).toEqual([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  });

  test('deselect all works correctly', async () => {
    const { user } = await renderCheckList();
    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);

    const checkedCheckBoxes = await screen.findAllByLabelText('Select check');
    checkedCheckBoxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    const selectedText = await screen.findByText(`${BASIC_CHECK_LIST.length} checks are selected.`);
    expect(selectedText).toBeInTheDocument();

    const deselectAll = await screen.findByLabelText('Select all');
    await user.click(deselectAll);
    const unCheckedCheckBoxes = await screen.findAllByLabelText('Select check');

    unCheckedCheckBoxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });

  test('indeterminate state works correctly', async () => {
    const { user } = await renderCheckList();
    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);

    const checkedCheckBoxes = await screen.findAllByLabelText('Select check');
    await user.click(checkedCheckBoxes[0]);

    const indeterminateState = await screen.findByLabelText('Select all');
    expect(indeterminateState).toBePartiallyChecked();

    await user.click(selectAll);

    checkedCheckBoxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  test(`bulk select is disabled when no checks are rendered because of an empty search`, async () => {
    const { user } = await renderCheckList();
    const searchInput = await screen.findByLabelText('Search checks');
    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);
    expect(selectAll).toBeChecked();

    await searchInput.focus();
    await user.paste('non-existent-check');

    await waitFor(() => expect(selectAll).toBeDisabled());
    expect(selectAll).not.toBeChecked();
  });

  test(`bulk selected items are reduced when a filter is added`, async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`bulkUpdateChecks`, {}, record));
    const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);

    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);
    expect(selectAll).toBeChecked();

    await user.click(screen.getByText('HTTP'));
    expect(selectAll).toBeChecked();

    const enableButton = await screen.getByText('Disable');
    await user.click(enableButton);

    const { body } = await read();

    expect(body).toEqual(
      [BASIC_HTTP_CHECK].map((check) => ({
        ...check,
        enabled: false,
      }))
    );
  });
});

function getModalContainer() {
  return document.body.querySelector(`[role="dialog"]`) as HTMLElement;
}
