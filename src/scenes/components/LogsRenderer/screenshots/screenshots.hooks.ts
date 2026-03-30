import { useEffect, useRef, useState } from 'react';

import { ScreenshotData } from './screenshots.types';
import { useSMDS } from 'hooks/useSMDS';

import { SCREENSHOT_LOG_SOURCE } from './screenshots.constants';
import { assembleChunkedScreenshots, extractFrameLines } from './screenshots.utils';

/**
 * Fetches screenshot data for the given UUIDs. The screenshot log lines can
 * contain either inline base64 data (optionally chunked) or a URL reference
 * to external storage (e.g. S3/GCS). Both formats are handled transparently.
 * Tracks which UUIDs have already been fetched to avoid duplicate requests.
 * Pass an empty array to skip fetching entirely (e.g. when the feature flag is off).
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
