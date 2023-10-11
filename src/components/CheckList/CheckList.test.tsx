import React from 'react';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { render, createInstance } from 'test/render';
import { CheckList } from './CheckList';
import { Check, CheckSort, ROUTES } from 'types';
import { SuccessRateContextProvider } from '../SuccessRateContextProvider';
import { PLUGIN_URL_PATH } from 'components/constants';

jest.mock('hooks/useNavigation', () => {
  const actual = jest.requireActual('hooks/useNavigation');
  return {
    __esModule: true,
    ...actual,
  };
});
const useNavigationHook = require('hooks/useNavigation');

jest.setTimeout(20000);

interface RenderChecklist {
  checks?: Check[];
}

const defaultChecks = [
  {
    id: 2,
    tenantId: 1,
    frequency: 60000,
    offset: 0,
    timeout: 2500,
    enabled: true,
    labels: [],
    settings: {
      ping: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
    probes: [1],
    target: 'grafana.com',
    job: 'tacos',
    created: 1597928927.7490728,
    modified: 1597928927.7490728,
  },
  {
    id: 1,
    tenantId: 1,
    frequency: 60000,
    offset: 0,
    timeout: 2500,
    enabled: true,
    labels: [],
    settings: {
      ping: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
    probes: [1],
    target: 'nachos.com',
    job: 'burritos',
    created: 1597928913.872104,
    modified: 1597928913.872104,
  },
  {
    id: 3,
    tenantId: 1,
    frequency: 60000,
    offset: 0,
    timeout: 2500,
    enabled: true,
    labels: [
      {
        name: 'carne',
        value: 'asada',
      },
    ],
    settings: {
      http: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
    probes: [22],
    target: 'example.com',
    job: 'chimichurri',
    created: 1597928965.8595479,
    modified: 1597928965.8595479,
  },
  {
    id: 4,
    tenantId: 1,
    frequency: 60000,
    offset: 0,
    timeout: 2500,
    enabled: false,
    labels: [
      {
        name: 'agreat',
        value: 'label',
      },
    ],
    settings: {
      ping: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
    probes: [1, 22],
    target: 'grafana.com',
    job: 'test3',
    created: 1597934254.494585,
  },
] as Check[];

const onCheckUpdate = jest.fn();

const renderCheckList = ({ checks = defaultChecks } = {} as RenderChecklist) => {
  const instance = createInstance();

  return render(
    <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Checks}`]}>
      <SuccessRateContextProvider checks={checks}>
        <CheckList instance={instance} checks={checks} onCheckUpdate={onCheckUpdate} />
      </SuccessRateContextProvider>
    </MemoryRouter>,
    {
      instance,
    }
  );
};

beforeEach(() => {
  localStorage.clear();
});

test('renders empty state', async () => {
  renderCheckList({ checks: [] });
  const emptyWarning = await screen.findByText('This account does not currently have any checks configured', {
    exact: false,
  });
  expect(emptyWarning).toBeInTheDocument();
});

test('renders list of checks', async () => {
  renderCheckList();
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(4);
});

test('search by text', async () => {
  const { user } = renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  filterInput.focus();
  const willBeRemoved = screen.getByText('chimichurri');

  await user.paste('example');
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search is case insensitive', async () => {
  const { user } = renderCheckList();
  const willBeRemoved = screen.getByText('chimichurri');
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  filterInput.focus();

  await user.paste('EXAMPLE');
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches job value', async () => {
  const { user } = renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText('chimichurri');
  filterInput.focus();
  await user.paste('tacos');

  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches target value', async () => {
  const { user } = renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText('chimichurri');

  filterInput.focus();

  await user.paste('asada');
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches label value', async () => {
  const { user } = renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText('chimichurri');
  filterInput.focus();

  await user.paste('nachos.com');
  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches label name', async () => {
  const { user } = renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  const willBeRemoved = screen.getByText('tacos');
  filterInput.focus();
  await user.paste('carne');

  await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('clicking label value adds to label filter', async () => {
  const { user } = renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters' });
  await user.click(additionalFilters);
  const labelValue = await screen.findAllByText('agreat: label');
  await user.click(labelValue[1]);
  const filterInput = await screen.findByTestId('check-label-filter');
  expect(filterInput).toHaveValue(['agreat: label']);
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by check type', async () => {
  const { user } = renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters' });
  await user.click(additionalFilters);
  const typeFilter = await screen.findByTestId('check-type-filter');
  await user.selectOptions(typeFilter, 'http');
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by probe', async () => {
  const { user } = renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters' });
  await user.click(additionalFilters);
  const probeFilter = await screen.findByTestId('probe-filter');
  await user.selectOptions(probeFilter, 'Chicago');
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(2);
});

test('loads search from localStorage', async () => {
  localStorage.setItem(
    'checkFilters',
    JSON.stringify({
      search: 'chimichurri',
      labels: [],
      type: 'all',
      status: { label: 'All', value: 0 },
      probes: [],
    })
  );
  renderCheckList();
  const searchInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  expect(searchInput).toHaveValue('chimichurri');

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
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters (1 active)', exact: false });
  userEvent.click(additionalFilters);
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
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters (1 active)', exact: false });
  userEvent.click(additionalFilters);
  const typeFilter = await screen.findByTestId('check-type-filter');
  expect(typeFilter).toHaveValue('http');

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('loads labels from localStorage', async () => {
  localStorage.setItem(
    'checkFilters',
    JSON.stringify({
      search: '',
      labels: ['agreat: label'],
      type: 'all',
      status: { label: 'All', value: 0 },
      probes: [],
    })
  );
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters (1 active)', exact: false });
  userEvent.click(additionalFilters);
  const filterInput = await screen.findByTestId('check-label-filter');
  expect(filterInput).toHaveValue(['agreat: label']);

  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('clicking type chiclet adds it to filter', async () => {
  const { user } = renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters' });
  await user.click(additionalFilters);
  const httpTypeChiclet = await screen.findAllByText('HTTP');
  await user.click(httpTypeChiclet[1]);
  const typeFilter = await screen.findByTestId('check-type-filter');
  const checks = await screen.findAllByTestId('check-card');
  expect(typeFilter).toHaveValue('http');
  expect(checks.length).toBe(1);
});

test('clicking status chiclet adds it to filter', async () => {
  const { user } = renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters' });
  await user.click(additionalFilters);
  const disabledChiclet = await screen.findAllByText('Disabled');
  await user.click(disabledChiclet[1]);
  const statusFilter = await screen.findByTestId('check-status-filter');
  const checks = await screen.findAllByTestId('check-card');
  expect(statusFilter).toHaveValue('2');
  expect(checks.length).toBe(1);
});

test('clicking add new is handled', async () => {
  const navigate = jest.fn();
  useNavigationHook.useNavigation = jest.fn(() => navigate); // TODO: COME BACK TO
  const { user } = renderCheckList();
  const addNewButton = await screen.findByRole('button', { name: 'Add new check' });
  await user.click(addNewButton);
  expect(navigate).toHaveBeenCalledWith(ROUTES.ChooseCheckType);
});

test('select all performs disable action on all visible checks', async () => {
  const { instance, user } = renderCheckList();
  const selectAll = await screen.findByTestId('selectAll');
  await user.click(selectAll);
  const selectedText = await screen.findByText('4 checks are selected.');
  expect(selectedText).toBeInTheDocument();
  const disableButton = await screen.findByRole('button', { name: 'Disable' });
  await user.click(disableButton);

  // await waitFor(() => expect(selectAll).not.toBeChecked());
  expect(instance.api.updateCheck).toHaveBeenCalledTimes(3);
  expect(instance.api.updateCheck).toHaveBeenCalledWith({
    created: 1597928913.872104,
    enabled: false,
    frequency: 60000,
    id: 1,
    job: 'burritos',
    labels: [],
    modified: 1597928913.872104,
    offset: 0,
    probes: [1],
    settings: { ping: { dontFragment: false, ipVersion: 'V4' } },
    target: 'nachos.com',
    tenantId: 1,
    timeout: 2500,
  });
  expect(instance.api.updateCheck).toHaveBeenCalledWith({
    created: 1597928965.8595479,
    enabled: false,
    frequency: 60000,
    id: 3,
    job: 'chimichurri',
    labels: [{ name: 'carne', value: 'asada' }],
    modified: 1597928965.8595479,
    offset: 0,
    probes: [22],
    settings: { http: { dontFragment: false, ipVersion: 'V4' } },
    target: 'example.com',
    tenantId: 1,
    timeout: 2500,
  });
  expect(instance.api.updateCheck).toHaveBeenCalledWith({
    created: 1597928927.7490728,
    enabled: false,
    frequency: 60000,
    id: 2,
    job: 'tacos',
    labels: [],
    modified: 1597928927.7490728,
    offset: 0,
    probes: [1],
    settings: { ping: { dontFragment: false, ipVersion: 'V4' } },
    target: 'grafana.com',
    tenantId: 1,
    timeout: 2500,
  });
});

test('select all performs enable action on all visible checks', async () => {
  const { instance, user } = renderCheckList();
  const selectAll = await screen.findByTestId('selectAll');
  await user.click(selectAll);
  const selectedText = await screen.findByText('4 checks are selected.');
  expect(selectedText).toBeInTheDocument();
  const disableButton = await screen.findByRole('button', { name: 'Enable' });
  await user.click(disableButton);

  expect(instance.api?.updateCheck).toHaveBeenCalledTimes(1);
  expect(instance.api?.updateCheck).toHaveBeenCalledWith({
    id: 4,
    tenantId: 1,
    frequency: 60000,
    offset: 0,
    timeout: 2500,
    enabled: true,
    labels: [
      {
        name: 'agreat',
        value: 'label',
      },
    ],
    settings: {
      ping: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
    probes: [1, 22],
    target: 'grafana.com',
    job: 'test3',
    created: 1597934254.494585,
  });
});

test('cascader adds labels to label filter', async () => {
  const { user } = renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters' });
  await user.click(additionalFilters);
  const cascader = await screen.findByRole('button', { name: 'Labels' });
  await user.click(cascader);
  const labelMenuItems = await screen.findAllByRole('menuitemcheckbox');
  expect(labelMenuItems.length).toBe(2);
  const labelName = await screen.findByRole('menuitemcheckbox', { name: 'carne' });
  await user.click(labelName);
  const labelValue = await screen.findByRole('menuitemcheckbox', { name: 'asada' });
  await user.click(labelValue);

  const labelFilterInput = await screen.findByTestId('check-label-filter');
  expect(labelFilterInput).toHaveValue(['carne: asada']);
});

test('Sorting by success rate should not crash', async () => {
  const { user } = renderCheckList();
  const sortPicker = await screen.findByTestId('check-list-sort');

  await user.selectOptions(sortPicker, CheckSort.SuccessRate.toString());
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(4);
});
