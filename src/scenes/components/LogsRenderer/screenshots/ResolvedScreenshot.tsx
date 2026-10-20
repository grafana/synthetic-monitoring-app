import React, { useState } from 'react';

import { ScreenshotData } from './screenshots.types';

import { ScreenshotThumbnail } from './ScreenshotThumbnail';

const STATUS_TEXT = {
  loading: 'Loading screenshot…',
  'missing-datasource': 'Screenshot datasource is not configured or available.',
  missing: 'Screenshot is unavailable or has been removed.',
  error: 'Could not load screenshot.',
};

export function ResolvedScreenshot({ screenshot }: { screenshot: ScreenshotData }) {
  const [failedURL, setFailedURL] = useState<string>();
  const imageFailed = !!failedURL && failedURL === screenshot.url;
  const status = screenshot.status ?? (imageFailed ? 'error' : undefined);
  if (status) {
    return (
      <div role="status">
        {STATUS_TEXT[status]}
        {status !== 'loading' && screenshot.retry && (
          <button
            type="button"
            onClick={() => {
              setFailedURL(undefined);
              screenshot.retry?.();
            }}
          >
            Retry screenshot
          </button>
        )}
      </div>
    );
  }
  return (
    <ScreenshotThumbnail
      url={screenshot.url}
      onError={
        screenshot.expiresAt
          ? () => {
              if (screenshot.expiresAt! <= Date.now()) {
                screenshot.retry?.();
              } else {
                setFailedURL(screenshot.url);
              }
            }
          : undefined
      }
    />
  );
}
