import { useEffect, useMemo, useState } from 'react';
import { AdHocFiltersVariable } from '@grafana/scenes';
import { useSceneContext } from '@grafana/scenes-react';

import { Check } from 'types';

import { useSummaryFilterLabels } from './useSummaryFilterLabels';

export function useSummaryFilters(checks: Check[], datasourceUid: string | undefined) {
  const scene = useSceneContext();
  const [filtersAdded, setFiltersAdded] = useState(false);
  const { getTagKeysProvider, getTagValuesProvider } = useSummaryFilterLabels(checks);
  const filters = useMemo(() => new AdHocFiltersVariable({ name: 'Filters', filters: [], applyMode: 'manual' }), []);

  // Refresh suggestions in place without clearing the user's selected filters.
  useEffect(() => {
    filters.setState({ datasource: { uid: datasourceUid }, getTagKeysProvider, getTagValuesProvider });
  }, [filters, datasourceUid, getTagKeysProvider, getTagValuesProvider]);

  useEffect(() => {
    if (!datasourceUid) {
      return;
    }
    const remove = scene.addVariable(filters);
    setFiltersAdded(true);
    return () => {
      remove();
      setFiltersAdded(false);
    };
  }, [scene, datasourceUid, filters]);

  return filtersAdded;
}
