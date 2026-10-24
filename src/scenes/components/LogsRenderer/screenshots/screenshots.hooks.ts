import { useEffect, useState } from 'react';

import { ScreenshotData } from './screenshots.types';
import { useSMDS } from 'hooks/useSMDS';

import { getScreenshotDatasource, lookupSagaScreenshot, ScreenshotLookupError } from './saga';

/** Resolve UUID markers from execution logs directly through Saga via Infinity. */
export function useScreenshots(
  uuids: string[],
  from: number | string,
  to: number | string
): Map<string, ScreenshotData> {
  const dataSource = useSMDS();
  const datasourceUID = getScreenshotDatasource(dataSource.instanceSettings?.jsonData.screenshots?.uid)?.uid;
  // Equivalent marker arrays must not cancel/restart requests on each render.
  const uuidKey = JSON.stringify([...new Set(uuids)]);
  const scope = JSON.stringify([uuidKey, from, to, datasourceUID]);
  const [state, setState] = useState<{ scope: string; images: Map<string, ScreenshotData> }>({
    scope,
    images: new Map(),
  });

  useEffect(() => {
    const ids: string[] = JSON.parse(uuidKey);
    let cancelled = false;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const inFlight = new Set<string>();
    const update = (id: string, image: ScreenshotData) => {
      if (!cancelled) {
        setState((prev) => ({ scope, images: new Map(prev.images).set(id, image) }));
      }
    };
    setState({ scope, images: new Map(ids.map((id) => [id, { id, status: 'loading' }])) });

    const fetchSaga = async (id: string) => {
      if (cancelled || inFlight.has(id)) {
        return;
      }
      clearTimeout(timers.get(id));
      if (!datasourceUID) {
        update(id, { id, status: 'missing-datasource' });
        return;
      }
      inFlight.add(id);
      // Keep the mounted thumbnail/modal while refreshing a previously resolved URL.
      setState((prev) => ({
        scope,
        images: new Map(prev.images).set(
          id,
          prev.images.get(id)?.url ? prev.images.get(id)! : { id, status: 'loading' }
        ),
      }));
      try {
        const image = await lookupSagaScreenshot(id, datasourceUID);
        if (cancelled) {
          return;
        }
        update(id, { ...image, retry: () => void fetchSaga(id) });
        // Refresh just before expiry. Reject already-expired metadata in the adapter
        // so a bad response cannot create an immediate, unbounded refresh loop.
        const remaining = image.expiresAt! - Date.now();
        timers.set(
          id,
          setTimeout(() => void fetchSaga(id), Math.min(Math.max(remaining - 1000, remaining / 2), 2147483647))
        );
      } catch (error) {
        update(id, {
          id,
          status: error instanceof ScreenshotLookupError ? error.kind : 'error',
          retry: () => void fetchSaga(id),
        });
      } finally {
        inFlight.delete(id);
      }
    };

    ids.forEach((id) => void fetchSaga(id));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [uuidKey, scope, datasourceUID]);

  return state.scope === scope ? state.images : new Map();
}
