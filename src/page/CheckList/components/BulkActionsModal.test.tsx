import React from 'react';
import { screen } from '@testing-library/react';
import { PROBES_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK, BASIC_PING_CHECK } from 'test/fixtures/checks';
import { DEFAULT_PROBES, DEPRECATED_PROBE, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
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
  const probes = await screen.findAllByTestId(PROBES_TEST_ID.button);
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

test('shows an error alert when the bulk update fails', async () => {
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

  server.use(
    apiRoute(`bulkUpdateChecks`, {
      result: () => ({
        status: 400,
        json: { err: 'request body too large', msg: '' },
      }),
    })
  );

  const { user } = renderBulkEditModal('add', checksWithASingleProbe);
  const probe = await screen.findByText(PRIVATE_PROBE_WITHMETADATA.displayName);
  await user.click(probe);
  const submitButton = await screen.findByText('Add probes');
  await user.click(submitButton);

  const errorAlert = await screen.findByRole('alert');
  expect(errorAlert).toHaveTextContent('Bulk update failed');
  expect(errorAlert).toHaveTextContent('The update operation failed');
  expect(onDismiss).not.toHaveBeenCalled();
});

test('prevents adding a deprecated probe', async () => {
  server.use(apiRoute('listProbes', { result: () => ({ json: [DEPRECATED_PROBE, PRIVATE_PROBE] }) }));
  renderBulkEditModal('add', [{ ...BASIC_HTTP_CHECK, probes: [PRIVATE_PROBE.id!] }]);
  expect(await screen.findByRole('button', { name: 'UAE' })).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('button', { name: 'Add probes' })).toBeDisabled();
});

test('removes deprecated probes and explicitly skips checks with no replacement', async () => {
  server.use(apiRoute('listProbes', { result: () => ({ json: [DEPRECATED_PROBE, PRIVATE_PROBE] }) }));
  const { record, read } = getServerRequests();
  server.use(apiRoute('bulkUpdateChecks', {}, record));
  const { user } = renderBulkEditModal('remove', [
    { ...BASIC_HTTP_CHECK, probes: [DEPRECATED_PROBE.id!] },
    { ...BASIC_PING_CHECK, probes: [DEPRECATED_PROBE.id!, PRIVATE_PROBE.id!] },
  ]);
  await user.click(await screen.findByRole('button', { name: 'UAE' }));
  expect(await screen.findByText('1 check will be skipped')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remove probes' }));
  const { body } = await read();
  expect(body).toEqual([{ ...BASIC_PING_CHECK, probes: [PRIVATE_PROBE.id!] }]);
});

test('does not submit when every check would lose its last probe', async () => {
  server.use(apiRoute('listProbes', { result: () => ({ json: [DEPRECATED_PROBE] }) }));
  const { user } = renderBulkEditModal('remove', [{ ...BASIC_HTTP_CHECK, probes: [DEPRECATED_PROBE.id!] }]);
  await user.click(await screen.findByRole('button', { name: 'UAE' }));
  expect(await screen.findByText('1 check will be skipped')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remove probes' })).toBeDisabled();
});
