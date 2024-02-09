import React from 'react';
import { screen } from '@testing-library/react';
import { createInstance, render } from 'test/render';

import { Check, IpVersion } from 'types';

import { BulkEditModal } from './BulkEditModal';

const onDismiss = jest.fn();
const selectedChecksSingleProbe = [
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
];

const selectedChecksMultiProbe = [
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
];

const renderBulkEditModal = (action: 'add' | 'remove', selectedChecks: Check[]) => {
  const instance = createInstance();

  return render(<BulkEditModal onDismiss={onDismiss} checks={selectedChecks} action={action} isOpen={true} />, {
    instance,
  });
};

test('shows the modal', async () => {
  renderBulkEditModal('add', selectedChecksSingleProbe);
  const title = await screen.findByText('Add probes to 2 selected checks');
  const probes = await screen.findAllByTestId('probe-button');
  expect(title).toBeInTheDocument();
  expect(probes).toHaveLength(2);
});

test('successfully adds probes', async () => {
  const { instance, user } = renderBulkEditModal('add', selectedChecksSingleProbe);
  const burritoProbe = await screen.findByText('burritos');
  const tacoProbe = await screen.findByText('tacos');
  await user.click(burritoProbe);
  await user.click(tacoProbe);
  const submitButton = await screen.findByText('Submit');
  await user.click(submitButton);

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
  const { instance, user } = renderBulkEditModal('remove', selectedChecksMultiProbe);
  expect(instance.api?.listProbes).toHaveBeenCalled();
  const burritoProbe = await screen.findByText('burritos');
  await user.click(burritoProbe);
  const submitButton = await screen.findByText('Submit');
  await user.click(submitButton);

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
