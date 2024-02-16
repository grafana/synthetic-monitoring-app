import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK, BASIC_PING_CHECK } from 'test/fixtures/checks';
import { DEFAULT_PROBES, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';

import { Check } from 'types';

import { BulkEditModal } from './BulkEditModal';

const onDismiss = jest.fn();

const renderBulkEditModal = (action: 'add' | 'remove', checks: Check[]) => {
  return render(<BulkEditModal onDismiss={onDismiss} checks={checks} action={action} isOpen={true} />);
};

test('shows the modal', async () => {
  const checks = [BASIC_HTTP_CHECK, BASIC_PING_CHECK];
  renderBulkEditModal('add', checks);
  const title = await screen.findByText(`Add probes to ${checks.length} selected checks`);
  const probes = await screen.findAllByTestId('probe-button');
  expect(title).toBeInTheDocument();
  expect(probes).toHaveLength(DEFAULT_PROBES.length);
});

test('successfully adds probes', async () => {
  const checksWithASingleProbe = [
    {
      ...BASIC_HTTP_CHECK,
      probes: [PUBLIC_PROBE.id],
    },
    {
      ...BASIC_PING_CHECK,
      probes: [PUBLIC_PROBE.id],
    },
  ];

  const { instance, user } = renderBulkEditModal('add', checksWithASingleProbe);
  const probe1 = await screen.findByText(PUBLIC_PROBE.name);
  const probe2 = await screen.findByText(PRIVATE_PROBE.name);
  await user.click(probe1);
  await user.click(probe2);
  const submitButton = await screen.findByText('Submit');
  await user.click(submitButton);

  expect(instance.api?.bulkUpdateChecks).toHaveBeenCalledWith([
    {
      ...BASIC_HTTP_CHECK,
      probes: [PUBLIC_PROBE.id, PRIVATE_PROBE.id],
    },
    {
      ...BASIC_PING_CHECK,
      probes: [PUBLIC_PROBE.id, PRIVATE_PROBE.id],
    },
  ]);
});

test('successfully removes probes', async () => {
  const { instance, user } = renderBulkEditModal('remove', [BASIC_HTTP_CHECK, BASIC_PING_CHECK]);
  expect(instance.api?.listProbes).toHaveBeenCalled();
  const probe1 = await screen.findByText(PUBLIC_PROBE.name);
  await user.click(probe1);
  const submitButton = await screen.findByText('Submit');
  await user.click(submitButton);

  expect(instance.api?.bulkUpdateChecks).toHaveBeenCalledWith([
    {
      ...BASIC_HTTP_CHECK,
      probes: [PRIVATE_PROBE.id],
    },
    {
      ...BASIC_PING_CHECK,
      probes: [PRIVATE_PROBE.id],
    },
  ]);
});
