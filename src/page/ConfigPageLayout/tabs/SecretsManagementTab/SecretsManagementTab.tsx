import React from 'react';

import { getUserPermissions } from 'data/permissions';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { SecretsManagementUI } from './SecretsManagementUI';

export function SecretsManagementTab() {
  const { isAdmin } = getUserPermissions();

  if (!isAdmin) {
    return (
      <ContactAdminAlert 
        title="Contact an admin: currently only admins are able to add, view, or remove secrets"
        missingPermissions={['Admin role']}
      />
    );
  }

  return (
    <QueryErrorBoundary>
      <SecretsManagementUI />
    </QueryErrorBoundary>
  );
}
