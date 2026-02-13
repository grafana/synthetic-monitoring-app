import { useEffect, useState } from 'react';
import { locationService } from '@grafana/runtime';

/**
 * Hook that syncs locationService's history with React state for use with
 * the low-level `<Router>` component. This ensures React Router and
 * locationService share the same history instance.
 *
 * @param initialPath - Initial path to navigate to. Defaults to '/'.
 * @returns `history` and `location` to spread onto `<Router navigator={history} location={location}>`.
 *
 * @see https://grafana.com/developers/plugin-tools/migration-guides/update-from-grafana-versions/migrate-10_0_x-to-10_1_x#4-fix-test-failures-with-location-service-methods
 */
export function useLocationServiceHistory(initialPath = '/') {
  const history = locationService.getHistory();
  const [location, setLocation] = useState(() => {
    history.replace(initialPath);
    return { ...history.location };
  });

  useEffect(() => {
    const unlisten = history.listen((update) => {
      // history v4/v5 passes { location, action }
      const newLocation = (update as unknown as { location: typeof location }).location;
      setLocation({ ...newLocation });
    });
    return unlisten;
  }, [history]);

  return { history, location };
}
