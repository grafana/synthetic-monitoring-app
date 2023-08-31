import React from 'react';
import { act, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CheckList } from './CheckList';
import { GrafanaInstances, Check, CheckSort, GlobalSettings, ROUTES } from 'types';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import { SuccessRateContextProvider } from '../SuccessRateContextProvider';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta } from '@grafana/data';
import { PLUGIN_URL_PATH } from 'components/constants';
import { wait } from '@testing-library/user-event/dist/utils';

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
  const instance = {
    api: getInstanceMock(),
    metrics: {},
    logs: {},
  } as GrafanaInstances;
  const meta = {} as AppPluginMeta<GlobalSettings>;

  render(
    <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Checks}`]}>
      <InstanceContext.Provider value={{ instance, loading: false, meta }}>
        <SuccessRateContextProvider checks={checks}>
          <CheckList instance={instance} checks={checks} onCheckUpdate={onCheckUpdate} />
        </SuccessRateContextProvider>
      </InstanceContext.Provider>
    </MemoryRouter>
  );
  return instance;
};

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
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  await act(async () => {
    await userEvent.paste(filterInput, 'example');
    // Need to wait for input debounce to finish
    await wait(1000);
  });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search is case insensitive', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  await act(async () => {
    await userEvent.paste(filterInput, 'EXAMPLE');
    // Need to wait for input debounce to finish
    await wait(1000);
  });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches job value', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  await act(async () => {
    await userEvent.paste(filterInput, 'tacos');
    // Need to wait for input debounce to finish
    await wait(1000);
  });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches target value', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  await act(async () => {
    await userEvent.paste(filterInput, 'asada');
    // Need to wait for input debounce to finish
    await wait(1000);
  });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches label value', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  await act(async () => {
    await userEvent.paste(filterInput, 'nachos.com');
    // Need to wait for input debounce to finish
    await wait(1000);
  });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('search matches label name', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
  await act(async () => {
    await userEvent.paste(filterInput, 'carne');
    // Need to wait for input debounce to finish
    await wait(1000);
  });
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('clicking label value adds to label filter', async () => {
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters', exact: false });
  userEvent.click(additionalFilters);
  const labelValue = await screen.findAllByText('agreat: label');
  act(() => {
    userEvent.click(labelValue[1]);
  });
  const filterInput = await screen.findByTestId('check-label-filter');
  expect(filterInput).toHaveValue(['agreat: label']);
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by check type', async () => {
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters', exact: false });
  userEvent.click(additionalFilters);
  const typeFilter = await screen.findByTestId('check-type-filter');
  userEvent.selectOptions(typeFilter, 'http');
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(1);
});

test('filters by probe', async () => {
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters', exact: false });
  userEvent.click(additionalFilters);
  const probeFilter = await screen.findByTestId('probe-filter');
  userEvent.selectOptions(probeFilter, 'Chicago');
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(2);
});

test('clicking type chiclet adds it to filter', async () => {
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters', exact: false });
  userEvent.click(additionalFilters);
  const httpTypeChiclet = await screen.findAllByText('HTTP');
  userEvent.click(httpTypeChiclet[1]);
  const typeFilter = await screen.findByTestId('check-type-filter');
  const checks = await screen.findAllByTestId('check-card');
  expect(typeFilter).toHaveValue('http');
  expect(checks.length).toBe(1);
});

test('clicking status chiclet adds it to filter', async () => {
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters', exact: false });
  userEvent.click(additionalFilters);
  const disabledChiclet = await screen.findAllByText('Disabled');
  userEvent.click(disabledChiclet[1]);
  const statusFilter = await screen.findByTestId('check-status-filter');
  const checks = await screen.findAllByTestId('check-card');
  expect(statusFilter).toHaveValue('2');
  expect(checks.length).toBe(1);
});

test('clicking add new is handled', async () => {
  const navigate = jest.fn();
  useNavigationHook.useNavigation = jest.fn(() => navigate);
  renderCheckList();
  const addNewButton = await screen.findByRole('button', { name: 'Add new check' });
  userEvent.click(addNewButton);
  expect(navigate).toHaveBeenCalledWith(ROUTES.ChooseCheckType);
});

test('select all performs disable action on all visible checks', async () => {
  const instance = renderCheckList();
  const selectAll = await screen.findByTestId('selectAll');
  userEvent.click(selectAll);
  const selectedText = await screen.findByText('4 checks are selected.');
  expect(selectedText).toBeInTheDocument();
  const disableButton = await screen.findByRole('button', { name: 'Disable' });
  userEvent.click(disableButton);
  await waitForElementToBeRemoved(() => screen.queryByText('4 checks are selected.'));
  // await waitFor(() => expect(selectAll).not.toBeChecked());
  expect(instance.api?.updateCheck).toHaveBeenCalledTimes(3);
  expect(instance.api?.updateCheck).toHaveBeenCalledWith({
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
  expect(instance.api?.updateCheck).toHaveBeenCalledWith({
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
  expect(instance.api?.updateCheck).toHaveBeenCalledWith({
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
  const instance = renderCheckList();
  const selectAll = await screen.findByTestId('selectAll');
  userEvent.click(selectAll);
  const selectedText = await screen.findByText('4 checks are selected.');
  expect(selectedText).toBeInTheDocument();
  const disableButton = await screen.findByRole('button', { name: 'Enable' });
  userEvent.click(disableButton);
  await waitForElementToBeRemoved(() => screen.queryByText('4 checks are selected.'));
  // await waitFor(() => expect(selectAll).not.toBeChecked());
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
  renderCheckList();
  const additionalFilters = await screen.findByRole('button', { name: 'Additional Filters', exact: false });
  userEvent.click(additionalFilters);
  const cascader = await screen.findByRole('button', { name: 'Labels' });
  userEvent.click(cascader);
  const labelMenuItems = await screen.findAllByRole('menuitemcheckbox');
  expect(labelMenuItems.length).toBe(2);
  const labelName = await screen.findByRole('menuitemcheckbox', { name: 'carne' });
  await waitFor(() => fireEvent.click(labelName));
  const labelValue = await screen.findByRole('menuitemcheckbox', { name: 'asada' });
  await waitFor(() => fireEvent.click(labelValue));

  const labelFilterInput = await screen.findByTestId('check-label-filter');
  expect(labelFilterInput).toHaveValue(['carne: asada']);
});

test('Sorting by success rate should not crash', async () => {
  renderCheckList();
  const sortPicker = await screen.findByTestId('check-list-sort');

  userEvent.selectOptions(sortPicker, CheckSort.SuccessRate.toString());
  const checks = await screen.findAllByTestId('check-card');
  expect(checks.length).toBe(4);
});
