import React from 'react';

import { ScreenshotData } from './screenshots.types';

import { ScreenshotThumbnail } from './ScreenshotThumbnail';

const STATUS_TEXT = {
  loading: 'Loading screenshot…',
  'missing-datasource': 'Screenshot datasource is not configured or available.',
  missing: 'Screenshot is unavailable or has been removed.',
  error: 'Could not load screenshot.',
};

export function ResolvedScreenshot({ screenshot }: { screenshot: ScreenshotData }) {
  const status = screenshot.status;
  if (status) {
    return (
      <div role="status">
        {STATUS_TEXT[status]}
        {status !== 'loading' && screenshot.retry && (
          <button
            type="button"
            onClick={() => {
              screenshot.retry?.();
            }}
          >
            Retry screenshot
          </button>
        )}
      </div>
    );
  }
  return <ScreenshotThumbnail url={screenshot.url} />;
}
