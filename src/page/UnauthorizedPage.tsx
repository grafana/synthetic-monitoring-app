import React from 'react';
import { PluginPage } from '@grafana/runtime';

import { ContactAdminAlert } from './ContactAdminAlert';

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
