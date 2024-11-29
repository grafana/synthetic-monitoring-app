import React from 'react';

import { ContactAdminAlert } from './ContactAdminAlert';
import { PluginPage } from '@grafana/runtime';

interface UnauthorizedPageProps {
  permissions: string[];
}

export const UnauthorizedPage = ({ permissions }: UnauthorizedPageProps) => {
  return (
    <PluginPage>
      <ContactAdminAlert missingPermissions={permissions} />
    </PluginPage>
  );
};
