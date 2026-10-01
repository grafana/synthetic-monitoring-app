import { AdHocFiltersVariable } from '@grafana/scenes';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CHECK_IN_PRODUCTION } from 'test/fixtures/folderChecks';
import { createWrapper } from 'test/render';

import { useSummaryFilterLabels } from './useSummaryFilterLabels';
import { useSummaryFilters } from './useSummaryFilters';

jest.mock('./useSummaryFilterLabels', () => ({ useSummaryFilterLabels: jest.fn() }));
const remove = jest.fn();
const scene = { addVariable: jest.fn((_variable: AdHocFiltersVariable) => remove) };
jest.mock('@grafana/scenes-react', () => ({
  ...jest.requireActual('@grafana/scenes-react'),
  useSceneContext: () => scene,
}));

function suggestions(key: string, value: string) {
  return {
    getTagKeysProvider: async () => ({ replace: true, values: [{ text: 'product', value: key }] }),
    getTagValuesProvider: async () => ({ replace: true, values: [{ text: value, value }] }),
  };
}

it('preserves selected filters while permissions and label mode refresh suggestions', async () => {
  const initial = suggestions('label_product', 'synthetics');
  jest.mocked(useSummaryFilterLabels).mockReturnValue(initial);
  const checks = [CHECK_IN_PRODUCTION];
  const { result, rerender, unmount } = renderHook(() => useSummaryFilters(checks, 'metrics'), {
    wrapper: createWrapper().Wrapper,
  });
  await waitFor(() => expect(result.current).toBe(true));
  const filters = scene.addVariable.mock.calls[0][0];
  const selected = [{ key: 'label_product', operator: '=', value: 'synthetics' }];
  act(() => filters.setState({ filters: selected }));

  for (const updated of [suggestions('label_product', 'newly-accessible'), suggestions('product', 'migrated')]) {
    jest.mocked(useSummaryFilterLabels).mockReturnValue(updated);
    rerender();
    await waitFor(() => expect(filters.state.getTagValuesProvider).toBe(updated.getTagValuesProvider));
    expect(filters.state.filters).toEqual(selected);
    expect(scene.addVariable).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
  }
  unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});
