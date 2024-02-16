import React from 'react';
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { BASIC_CHECK_LIST, BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckSort, ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/constants';

import { CheckList } from './CheckList';
import { Check } from 'types';

jest.mock('hooks/useNavigation', () => {
  const actual = jest.requireActual('hooks/useNavigation');
  return {
    __esModule: true,
    ...actual,
  };
});
const useNavigationHook = require('hooks/useNavigation');

jest.setTimeout(20000);

const renderCheckList = (checks = BASIC_CHECK_LIST) => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: checks,
        };
      },
    })
  );

  return waitFor(() =>
    render(<CheckList />, {
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    })
  );
};

beforeEach(() => {
  localStorage.clear();
});

test('renders empty state', async () => {
  await renderCheckList([]);
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
  const additionalFilters = await screen.findByRole('button', { name: /Additional filters/i });
  await user.click(additionalFilters);
  const filterInput = await screen.findByTestId('check-label-filter');
  expect(filterInput).toHaveValue([constructedLabel]);
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by check type', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByRole('button', { name: 'Additional filters' });
  await user.click(additionalFilters);
  const typeFilter = await screen.findByTestId('check-type-filter');
  await user.selectOptions(typeFilter, 'http');
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by probe', async () => {
  const DNS_CHECK_WITH_REMOVED_PROBE: Check = {
    ...BASIC_DNS_CHECK,
    probes: [PUBLIC_PROBE.id] as number[],
  };

  const { user } = await renderCheckList([DNS_CHECK_WITH_REMOVED_PROBE, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByRole('button', { name: 'Additional filters' });
  await user.click(additionalFilters);
  const probeFilter = await screen.findByTestId('probe-filter');
  await user.selectOptions(probeFilter, PRIVATE_PROBE.name);
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
  localStorage.setItem(
    'checkFilters',
    JSON.stringify({
      search: '',
      labels: [],
      type: 'all',
      status: { label: 'Disabled', value: 2 },
      probes: [],
    })
  );

  const DNS_CHECK_DISABLED = {
    ...BASIC_DNS_CHECK,
    enabled: false,
  };

  const { user } = await renderCheckList([DNS_CHECK_DISABLED, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByRole('button', { name: /Additional filters \(1 active\)/i });
  await user.click(additionalFilters);
  const statusFilter = await screen.findByTestId('check-status-filter');
  expect(statusFilter).toHaveValue('2');

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('loads type filter from localStorage', async () => {
  localStorage.setItem(
    'checkFilters',
    JSON.stringify({
      search: '',
      labels: [],
      type: 'http',
      status: { label: 'All', value: 0 },
      probes: [],
    })
  );
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByRole('button', { name: /Additional filters \(1 active\)/i });
  await user.click(additionalFilters);
  const typeFilter = await screen.findByTestId('check-type-filter');
  expect(typeFilter).toHaveValue('http');

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('loads labels from localStorage', async () => {
  const label = BASIC_DNS_CHECK.labels[0];
  const constructedLabel = `${label.name}: ${label.value}`;

  localStorage.setItem(
    'checkFilters',
    JSON.stringify({
      search: '',
      labels: [constructedLabel],
      type: 'all',
      status: { label: 'All', value: 0 },
      probes: [],
    })
  );
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByRole('button', { name: /Additional filters \(1 active\)/i });
  await user.click(additionalFilters);
  const filterInput = await screen.findByTestId('check-label-filter');
  expect(filterInput).toHaveValue([constructedLabel]);

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('clicking type chiclet adds it to filter', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const httpTypeChiclet = await screen.findAllByText('HTTP');
  await user.click(httpTypeChiclet[0]);
  const additionalFilters = await screen.findByRole('button', { name: /Additional filters/i });
  await user.click(additionalFilters);
  const typeFilter = await screen.findByTestId('check-type-filter');
  const checks = await screen.findAllByTestId('check-card');
  expect(typeFilter).toHaveValue('http');
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
  const additionalFilters = await screen.findByRole('button', { name: /Additional filters/i });
  await user.click(additionalFilters);
  const statusFilter = await screen.findByTestId('check-status-filter');
  const checks = await screen.findAllByTestId('check-card');
  expect(statusFilter).toHaveValue('2');
  expect(checks.length).toBe(1);
});

test('clicking add new is handled', async () => {
  const navigate = jest.fn();
  useNavigationHook.useNavigation = jest.fn(() => navigate); // TODO: COME BACK TO
  const { user } = await renderCheckList();
  const addNewButton = await screen.findByRole('button', { name: 'Add new check' });
  await user.click(addNewButton);
  expect(navigate).toHaveBeenCalledWith(ROUTES.ChooseCheckType);
});

test('select all performs disable action on all visible checks', async () => {
  const { read, record } = getServerRequests();
  server.use(apiRoute(`updateCheck`, {}, record));

  const checkList = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK];
  const { user } = await renderCheckList(checkList);
  const selectAll = await screen.findByTestId('selectAll');
  await user.click(selectAll);
  const selectedText = await screen.findByText(`${checkList.length} checks are selected.`);
  expect(selectedText).toBeInTheDocument();
  const disableButton = await screen.findByRole('button', { name: 'Disable' });

  await user.click(disableButton);

  const DNSrequest = await read(0);
  const HTTPRequst = await read(1);

  expect(DNSrequest.body).toEqual({
    ...BASIC_DNS_CHECK,
    enabled: false,
  });

  expect(HTTPRequst.body).toEqual({
    ...BASIC_HTTP_CHECK,
    enabled: false,
  });
});

test('select all performs enable action on all visible checks', async () => {
  const { read, record } = getServerRequests();
  server.use(apiRoute(`updateCheck`, {}, record));

  const checkList = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK].map((check) => ({
    ...check,
    enabled: false,
  }));
  const { user } = await renderCheckList(checkList);
  const selectAll = await screen.findByTestId('selectAll');
  await user.click(selectAll);
  const selectedText = await screen.findByText(`${checkList.length} checks are selected.`);
  expect(selectedText).toBeInTheDocument();
  const disableButton = await screen.findByRole('button', { name: 'Enable' });
  await user.click(disableButton);

  const DNSrequest = await read(0);
  const HTTPRequst = await read(1);

  expect(DNSrequest.body).toEqual(BASIC_DNS_CHECK);
  expect(HTTPRequst.body).toEqual(BASIC_HTTP_CHECK);
});

test('cascader adds labels to label filter', async () => {
  const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  const additionalFilters = await screen.findByRole('button', { name: 'Additional filters' });
  await user.click(additionalFilters);
  const cascader = await screen.findByRole('button', { name: 'Labels' });
  await user.click(cascader);
  const labelMenuItems = await screen.findAllByRole('menuitemcheckbox');
  expect(labelMenuItems.length).toBe(2);
  const labelName = await screen.findByRole('menuitemcheckbox', { name: BASIC_DNS_CHECK.labels[0].name });
  await user.click(labelName);
  const labelValue = await screen.findByRole('menuitemcheckbox', { name: BASIC_DNS_CHECK.labels[0].value });
  await user.click(labelValue);

  const labelFilterInput = await screen.findByTestId('check-label-filter');
  const constructedLabel = `${BASIC_DNS_CHECK.labels[0].name}: ${BASIC_DNS_CHECK.labels[0].value}`;
  expect(labelFilterInput).toHaveValue([constructedLabel]);
});

test('Sorting by success rate should not crash', async () => {
  const { user } = await renderCheckList();
  const sortPicker = await screen.findByTestId('check-list-sort');

  await user.selectOptions(sortPicker, CheckSort.ReachabilityAsc.toString());
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(BASIC_CHECK_LIST.length);
});
