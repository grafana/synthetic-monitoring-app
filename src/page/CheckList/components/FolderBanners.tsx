import React from 'react';
import { Alert } from '@grafana/ui';

import { ErrorAlert } from 'components/ErrorAlert';

export function FolderNotProvisionedBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Alert severity="info" title="Folder features are unavailable" onRemove={onDismiss}>
      Checks are organized inside a <strong>Grafana Synthetic Monitoring</strong> folder, but it has not been created yet. A user with <code>folders:create</code> permission needs to open Synthetic Monitoring to initialize the default folder. Checks are shown without folder grouping.
    </Alert>
  );
}

export function FolderPermissionBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Alert severity="info" title="Folder features are unavailable" onRemove={onDismiss}>
      You lack the required <code>folders:read</code> permission. Contact your organization administrator to update your role. Checks are shown without folder grouping.
    </Alert>
  );
}

export function FolderErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorAlert
      title="Failed to load folder information"
      content="Something went wrong while loading folders. Checks are shown without folder grouping."
      buttonText="Retry"
      onClick={onRetry}
    />
  );
}
