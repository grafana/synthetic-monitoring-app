import React from 'react';

import { getUserPermissions } from 'data/permissions';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { SecretsManagementUI } from './SecretsManagementUI';

export function SecretsManagementTab() {
  const { canReadSecrets, canCreateSecrets } = getUserPermissions();

  if (!canReadSecrets && !canCreateSecrets) {
    return (
      <ContactAdminAlert
        title="Contact an admin: you need either read or create permissions for secrets"
        missingPermissions={['secret.securevalues:read', 'secret.securevalues:create']}
      />
    );
  }

  return (
    <QueryErrorBoundary>
      <SecretsManagementUI />
    </QueryErrorBoundary>
  );
}
