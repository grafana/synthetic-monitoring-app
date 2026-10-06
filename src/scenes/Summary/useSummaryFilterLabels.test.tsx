import { AdHocFiltersVariable } from '@grafana/scenes';
import { renderHook, waitFor } from '@testing-library/react';
import { CHECK_IN_FORBIDDEN_FOLDER, CHECK_IN_PRODUCTION } from 'test/fixtures/folderChecks';
import { apiRoute } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsRBACReader } from 'test/utils';

import { FeatureName } from 'types';
import { LabelMode } from 'datasource/responses.types';

import { useSummaryFilterLabels } from './useSummaryFilterLabels';

const checks = [
  { ...CHECK_IN_PRODUCTION, labels: [{ name: 'product', value: 'synthetics' }] },
  { ...CHECK_IN_PRODUCTION, id: 300, labels: [{ name: 'product', value: 'synthetics' }] },
  {
    ...CHECK_IN_FORBIDDEN_FOLDER,
    labels: [
      { name: 'product', value: 'private' },
      { name: 'secret', value: 'hidden' },
    ],
  },
];
const variable = new AdHocFiltersVariable({ name: 'Filters' });

describe('homepage label suggestions', () => {
  beforeEach(() => {
    runTestAsRBACReader();
    mockFeatureToggles({ [FeatureName.Folders]: true });
  });

  it('provides deduplicated values and keys from visible checks without a metrics lookup', async () => {
    const { result } = renderHook(() => useSummaryFilterLabels(checks), { wrapper: createWrapper().Wrapper });
    await waitFor(async () => {
      expect(await result.current.getTagKeysProvider()).toEqual({
        replace: true,
        values: [{ text: 'product', value: 'label_product' }],
      });
    });
    expect(await result.current.getTagValuesProvider(variable, { key: 'label_product' })).toEqual({
      replace: true,
      values: [{ text: 'synthetics', value: 'synthetics' }],
    });
    expect(await result.current.getTagValuesProvider(variable, { key: 'label_secret' })).toEqual({
      replace: true,
      values: [],
    });
  });

  it.each([
    [LabelMode.Prefixed, 'label_product'],
    [LabelMode.DualWrite, 'label_product'],
    [LabelMode.Unprefixed, 'product'],
  ])('uses the query key for label mode %s and resolves both forms', async (mode, key) => {
    server.use(apiRoute('getLabelMode', { result: () => ({ json: { mode, systemLabels: [] } }) }));
    const { result } = renderHook(() => useSummaryFilterLabels(checks), { wrapper: createWrapper().Wrapper });
    await waitFor(async () => {
      expect(await result.current.getTagKeysProvider()).toEqual({
        replace: true,
        values: [{ text: 'product', value: key }],
      });
    });
    for (const key of ['product', 'label_product']) {
      expect(await result.current.getTagValuesProvider(variable, { key })).toEqual({
        replace: true,
        values: [{ text: 'synthetics', value: 'synthetics' }],
      });
    }
  });

  it('preserves suggestions for all checks when folders are disabled', async () => {
    mockFeatureToggles({ [FeatureName.Folders]: false });
    const { result } = renderHook(() => useSummaryFilterLabels(checks), { wrapper: createWrapper().Wrapper });
    await waitFor(async () => {
      expect(await result.current.getTagValuesProvider(variable, { key: 'label_product' })).toEqual({
        replace: true,
        values: [
          { text: 'synthetics', value: 'synthetics' },
          { text: 'private', value: 'private' },
        ],
      });
    });
  });

  it('returns no options when all checks are restricted', async () => {
    const restricted = [checks[2]];
    const { result } = renderHook(() => useSummaryFilterLabels(restricted), { wrapper: createWrapper().Wrapper });
    await waitFor(async () => {
      expect(await result.current.getTagKeysProvider()).toEqual({ replace: true, values: [] });
    });
    expect(await result.current.getTagValuesProvider(variable, { key: 'label_product' })).toEqual({
      replace: true,
      values: [],
    });
  });
});
