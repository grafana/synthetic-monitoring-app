import { act, renderHook, waitFor } from '@testing-library/react';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import { apiRoute, getServerRequests } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';
import { runTestAsCheckWriterWithoutRead } from 'test/utils';

import { useCreateTemplateCheck } from './useCreateTemplateCheck';

it.each([false, true])('creates without check-read access (duplicate conflict: %s)', async (conflict) => {
  runTestAsCheckWriterWithoutRead();
  const creations = getServerRequests();
  const listings = getServerRequests();
  server.use(
    apiRoute('listChecks', { result: () => ({ status: 403, json: { err: 'Forbidden' } }) }, listings.record),
    apiRoute(
      'addCheck',
      {
        result: async (req) =>
          conflict && creations.requests.length === 1
            ? { status: 409, json: { err: 'target/job combination already exists' } }
            : { json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()) } },
      },
      creations.record
    )
  );
  const { Wrapper } = createWrapper();
  const { result } = renderHook(() => useCreateTemplateCheck(), { wrapper: Wrapper });
  await waitFor(() => expect(result.current).not.toBeNull());
  await act(async () => {
    await result.current.mutateAsync({ ...COMPLEX_BROWSER_CHECK, job: 'Detect broken links' });
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(listings.requests).toHaveLength(0);
  expect(creations.requests).toHaveLength(conflict ? 2 : 1);
  expect((await creations.read(0)).body.job).toBe('Detect broken links');
  if (conflict) {
    expect((await creations.read(1)).body.job).toBe('Detect broken links (2)');
  }
});
