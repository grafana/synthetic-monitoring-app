import { toDataFrame } from '@grafana/data';
import { renderHook, waitFor } from '@testing-library/react';
import { CHECK_IN_FORBIDDEN_FOLDER, CHECK_IN_PRODUCTION } from 'test/fixtures/folderChecks';
import { apiRoute } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsRBACReader } from 'test/utils';

import { FeatureName } from 'types';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';

import { filterChecksById } from './SummaryTableViz.utils';

const checks = [CHECK_IN_PRODUCTION, CHECK_IN_FORBIDDEN_FOLDER];
const frame = toDataFrame({
  fields: [
    { name: 'id', values: checks.map((check) => check.id) },
    { name: 'job', values: checks.map((check) => check.job) },
    { name: 'latency', values: [10, 20] },
  ],
});

describe('summary table folder visibility', () => {
  beforeEach(() => {
    runTestAsRBACReader();
    mockFeatureToggles({ [FeatureName.Folders]: true });
  });

  function useVisibleRows() {
    const { visibleChecks, isResolving } = useCheckFolderAccess(checks);
    const ids = new Set(isResolving ? [] : visibleChecks.map((check) => String(check.id)));
    return filterChecksById([frame], ids)[0];
  }

  it('shows only checks in accessible folders', async () => {
    const { result } = renderHook(useVisibleRows, { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.fields[1].values).toEqual([CHECK_IN_PRODUCTION.job]));
    expect(result.current.fields[2].values).toEqual([10]);
    expect(result.current.length).toBe(1);
  });

  it('preserves visibility when folders are disabled', async () => {
    mockFeatureToggles({ [FeatureName.Folders]: false });
    const { result } = renderHook(useVisibleRows, { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.length).toBe(2));
  });

  it('preserves legacy visibility when the default folder cannot be accessed', async () => {
    server.use(apiRoute('getFolder', { result: () => ({ status: 403, json: { message: 'Access denied' } }) }));
    const { result } = renderHook(useVisibleRows, { wrapper: createWrapper().Wrapper });
    await waitFor(() => expect(result.current.length).toBe(2));
  });

  it('hides all rows when no checks are accessible, including frames without IDs', () => {
    expect(filterChecksById([frame], new Set())[0].length).toBe(0);
    const unidentified = toDataFrame({ fields: [{ name: 'job', values: ['Hidden'] }] });
    expect(filterChecksById([unidentified], new Set(['200']))[0].length).toBe(0);
  });

  it('matches string IDs and leaves the original query data unchanged', () => {
    const data = toDataFrame({ fields: [{ name: 'id', values: ['200', '203'] }] });
    expect(filterChecksById([data], new Set(['203']))[0].fields[0].values).toEqual(['203']);
    expect(data.length).toBe(2);
    expect(data.fields[0].values).toEqual(['200', '203']);
  });
});
