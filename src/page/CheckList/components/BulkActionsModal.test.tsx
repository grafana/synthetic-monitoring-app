import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK, BASIC_PING_CHECK } from 'test/fixtures/checks';
import { DEFAULT_PROBES, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { probeToMetadataProbe } from 'test/utils';

import { Check } from 'types';

import { BulkActionsModal } from './BulkActionsModal';

const onDismiss = jest.fn();

const PUBLIC_PROBE_WITHMETADATA = probeToMetadataProbe(PUBLIC_PROBE);
const PRIVATE_PROBE_WITHMETADATA = probeToMetadataProbe(PRIVATE_PROBE);

const renderBulkEditModal = (action: 'add' | 'remove', checks: Check[]) => {
  return render(<BulkActionsModal onDismiss={onDismiss} checks={checks} action={action} isOpen={true} />);
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
  const checksWithASingleProbe: Check[] = [
    {
      ...BASIC_HTTP_CHECK,
      probes: [PUBLIC_PROBE.id] as number[],
    },
    {
      ...BASIC_PING_CHECK,
      probes: [PUBLIC_PROBE.id] as number[],
    },
  ];

  const { record, read } = getServerRequests();
  server.use(apiRoute(`bulkUpdateChecks`, {}, record));

  const { user } = renderBulkEditModal('add', checksWithASingleProbe);
  const probe1 = await screen.findByText(PUBLIC_PROBE_WITHMETADATA.displayName);
  const probe2 = await screen.findByText(PRIVATE_PROBE_WITHMETADATA.displayName);
  await user.click(probe1);
  await user.click(probe2);
  const submitButton = await screen.findByText('Add probes');
  await user.click(submitButton);

  const { body } = await read();

  expect(body).toEqual([
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

test('Does not add duplicated probes', async () => {
  const checksWithASingleProbe: Check[] = [
    {
      ...BASIC_HTTP_CHECK,
      probes: [PUBLIC_PROBE.id, PRIVATE_PROBE.id] as number[],
    },
    {
      ...BASIC_PING_CHECK,
      probes: [PUBLIC_PROBE.id] as number[],
    },
  ];

  const { record, read } = getServerRequests();
  server.use(apiRoute(`bulkUpdateChecks`, {}, record));

  const { user } = renderBulkEditModal('add', checksWithASingleProbe);
  const probe1 = await screen.findByText(PUBLIC_PROBE_WITHMETADATA.displayName);
  const probe2 = await screen.findByText(PRIVATE_PROBE_WITHMETADATA.displayName);
  
  await user.click(probe1);
  await user.click(probe2);
  const submitButton = await screen.findByText('Add probes');
  await user.click(submitButton);

  const { body } = await read();

  expect(body).toEqual([
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
  const { record, read } = getServerRequests();
  server.use(apiRoute(`bulkUpdateChecks`, {}, record));

  const { user } = renderBulkEditModal('remove', [BASIC_HTTP_CHECK, BASIC_PING_CHECK]);
  const probe1 = await screen.findByText(PUBLIC_PROBE_WITHMETADATA.displayName);
  await user.click(probe1);
  const submitButton = await screen.findByText('Remove probes');
  await user.click(submitButton);

  const { body } = await read();

  expect(body).toEqual([
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
