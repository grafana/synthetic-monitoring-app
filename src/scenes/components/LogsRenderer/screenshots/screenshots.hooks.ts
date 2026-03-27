import { useEffect, useRef, useState } from 'react';

import { ScreenshotData } from './screenshots.types';
import { useSMDS } from 'hooks/useSMDS';

import { SCREENSHOT_LOG_SOURCE } from './screenshots.constants';
import { assembleChunkedScreenshots, extractFrameLines } from './screenshots.utils';

/**
 * Fetches and assembles screenshot data from Loki for the given UUIDs.
 * Tracks which UUIDs have already been fetched to avoid duplicate requests.
 * Pass a stable empty array (EMPTY_UUIDS) to skip fetching entirely.
 */
export function useScreenshots(uuids: string[]): Map<string, ScreenshotData> {
  const dataSource = useSMDS();
  const [screenshotsByUUID, setScreenshotsByUUID] = useState<Map<string, ScreenshotData>>(new Map());
  const fetchedUUIDsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newUUIDs = uuids.filter((uuid) => !fetchedUUIDsRef.current.has(uuid));

    if (newUUIDs.length === 0) {
      return;
    }

    let cancelled = false;

    const fetchScreenshots = async () => {
      try {
        const uuidPattern = newUUIDs.join('|');
        const expr = `{source="${SCREENSHOT_LOG_SOURCE}"} |~ "${uuidPattern}" | json`;
        const result = await dataSource.queryLogsV2(expr, 'now-1h', 'now');

        if (cancelled) {
          return;
        }

        const lines = extractFrameLines(result);
        const dataMap = assembleChunkedScreenshots(lines);

        setScreenshotsByUUID((prev) => new Map([...prev, ...dataMap]));
        newUUIDs.forEach((uuid) => fetchedUUIDsRef.current.add(uuid));
      } catch {
        // Screenshots are supplementary -- silently degrade
      }
    };

    fetchScreenshots();

    return () => {
      cancelled = true;
    };
  }, [uuids, dataSource]);

  return screenshotsByUUID;
}
