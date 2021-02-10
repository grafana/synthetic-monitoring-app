import React from 'react';
import { CheckList } from './CheckList';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GrafanaInstances, Check } from 'types';
import { getInstanceMock } from '../datasource/__mocks__/DataSource';

const onAddNewMock = jest.fn();
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
    probes: [1],
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
    probes: [1],
    target: 'grafana.com',
    job: 'test3',
    created: 1597934254.494585,
  },
] as Check[];

const renderCheckList = ({ checks = defaultChecks } = {} as RenderChecklist) => {
  const instance = {
    api: getInstanceMock(),
    metrics: {},
    logs: {},
  } as GrafanaInstances;
  render(<CheckList instance={instance} onAddNewClick={onAddNewMock} checks={checks} />);
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
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(4);
});

test('filters by text', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('search checks');
  userEvent.type(filterInput, 'example');
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(1);
});

test('filter is case insensitive', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('search checks');
  userEvent.type(filterInput, 'EXAMPLE');
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(1);
});

test('filter matches job value', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('search checks');
  userEvent.type(filterInput, 'tacos');
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(1);
});

test('filter matches target value', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('search checks');
  userEvent.type(filterInput, 'asada');
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(1);
});

test('filter matches label value', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('search checks');
  userEvent.type(filterInput, 'nachos.com');
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(1);
});

test('filter matches label name', async () => {
  renderCheckList();
  const filterInput = await screen.findByPlaceholderText('search checks');
  userEvent.type(filterInput, 'carne');
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(1);
});

test('clicking label value adds to filter', async () => {
  renderCheckList();
  const labelValue = await screen.findByRole('button', { name: 'agreat=label' });
  userEvent.click(labelValue);
  const checks = await screen.findAllByLabelText('check-card');
  const filterInput = await screen.findByPlaceholderText('search checks');
  expect(filterInput).toHaveValue('agreat=label');
  expect(checks.length).toBe(1);
});

test('filters by check type', async () => {
  renderCheckList();
  const selectInput = await screen.findByTestId('select');
  userEvent.selectOptions(selectInput, 'http');
  const checks = await screen.findAllByLabelText('check-card');
  expect(checks.length).toBe(1);
});

test('clicking add new is handled', async () => {
  renderCheckList();
  const addNewButton = await screen.findByRole('button', { name: 'New Check' });
  userEvent.click(addNewButton);
  expect(onAddNewMock).toHaveBeenCalledTimes(1);
});
