import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react-hooks';

import { render, createInstance } from 'test/render';
import { IpVersion, FilteredCheck } from 'types';
import BulkEditModal from './BulkEditModal';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

const onDismiss = jest.fn();
const onSuccess = jest.fn();
const onError = jest.fn().mockImplementation((error: string) => {
  return error;
});
const selectedChecksSingleProbe = jest.fn().mockReturnValue([
  {
    job: '',
    alertSensitivity: 'none',
    target: '',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: [],
    probes: [32],
    settings: {
      ping: {
        ipVersion: IpVersion.V4,
        dontFragment: false,
      },
    },
    basicMetricsOnly: false,
  },
  {
    job: '',
    alertSensitivity: 'none',
    target: '',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: [],
    probes: [42],
    settings: {
      ping: {
        ipVersion: IpVersion.V4,
        dontFragment: false,
      },
    },
    basicMetricsOnly: false,
  },
]);

const selectedChecksMultiProbe = jest.fn().mockReturnValue([
  {
    job: '',
    alertSensitivity: 'none',
    target: '',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: [],
    probes: [32, 42],
    settings: {
      ping: {
        ipVersion: IpVersion.V4,
        dontFragment: false,
      },
    },
    basicMetricsOnly: false,
  },
  {
    job: '',
    alertSensitivity: 'none',
    target: '',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: [],
    probes: [32, 42],
    settings: {
      ping: {
        ipVersion: IpVersion.V4,
        dontFragment: false,
      },
    },
    basicMetricsOnly: false,
  },
]);

const renderBulkEditModal = (action: 'add' | 'remove' | null, selectedChecks: () => FilteredCheck[]) => {
  const instance = createInstance();

  render(
    <SuccessRateContextProvider checks={[]}>
      <BulkEditModal
        onDismiss={onDismiss}
        onSuccess={onSuccess}
        onError={onError}
        selectedChecks={selectedChecks}
        instance={instance}
        action={action}
        isOpen={true}
      />
    </SuccessRateContextProvider>,
    {
      instance,
    }
  );

  return instance;
};

test('shows the modal', async () => {
  renderBulkEditModal('add', selectedChecksSingleProbe);
  const title = await screen.findByText('Add probes to 2 selected checks');
  const probes = await screen.findAllByTestId('probe-button');
  expect(title).toBeInTheDocument();
  expect(probes).toHaveLength(2);
});

test('successfully adds probes', async () => {
  const instance = renderBulkEditModal('add', selectedChecksSingleProbe);
  await act(async () => {
    const burritoProbe = await screen.findByText('burritos');
    const tacoProbe = await screen.findByText('tacos');
    userEvent.click(burritoProbe);
    userEvent.click(tacoProbe);
    const submitButton = await screen.findByText('Submit');
    userEvent.click(submitButton);
  });
  expect(instance.api?.bulkUpdateChecks).toHaveBeenCalledWith([
    {
      job: '',
      alertSensitivity: 'none',
      target: '',
      frequency: 60000,
      timeout: 3000,
      enabled: true,
      labels: [],
      probes: [32, 42],
      settings: {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: false,
        },
      },
      basicMetricsOnly: false,
    },
    {
      job: '',
      alertSensitivity: 'none',
      target: '',
      frequency: 60000,
      timeout: 3000,
      enabled: true,
      labels: [],
      probes: [42, 32],
      settings: {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: false,
        },
      },
      basicMetricsOnly: false,
    },
  ]);
});

test('successfully removes probes', async () => {
  const instance = renderBulkEditModal('remove', selectedChecksMultiProbe);
  expect(instance.api?.listProbes).toHaveBeenCalled();
  await act(async () => {
    const burritoProbe = await screen.findByText('burritos');
    userEvent.click(burritoProbe);
    const submitButton = await screen.findByText('Submit');
    userEvent.click(submitButton);
  });
  expect(instance.api?.bulkUpdateChecks).toHaveBeenCalledWith([
    {
      job: '',
      alertSensitivity: 'none',
      target: '',
      frequency: 60000,
      timeout: 3000,
      enabled: true,
      labels: [],
      probes: [32],
      settings: {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: false,
        },
      },
      basicMetricsOnly: false,
    },
    {
      job: '',
      alertSensitivity: 'none',
      target: '',
      frequency: 60000,
      timeout: 3000,
      enabled: true,
      labels: [],
      probes: [32],
      settings: {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: false,
        },
      },
      basicMetricsOnly: false,
    },
  ]);
});
