import React from 'react';

import { ContactAdminAlert } from './ContactAdminAlert';
import { SubsectionWelcomePage } from './SubsectionWelcomePage';

interface UnauthorizedPageProps {
  permissions: string[];
}

export const UnauthorizedPage = ({ permissions }: UnauthorizedPageProps) => {
  return (
    <SubsectionWelcomePage>
      <ContactAdminAlert missingPermissions={permissions} />
    </SubsectionWelcomePage>
  );
};
