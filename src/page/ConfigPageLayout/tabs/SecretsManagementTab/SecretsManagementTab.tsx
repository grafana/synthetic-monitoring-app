import React from 'react';

import { getUserPermissions } from 'data/permissions';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { SecretsManagementUI } from './SecretsManagementUI';

export function SecretsManagementTab() {
  const { canReadSecrets } = getUserPermissions();

  if (!canReadSecrets) {
    return (
      <ContactAdminAlert
        title="Contact an admin: you don't have permissions to view secrets"
        missingPermissions={['secret.securevalues:read']}
      />
    );
  }

  return (
    <QueryErrorBoundary>
      <SecretsManagementUI />
    </QueryErrorBoundary>
  );
}
