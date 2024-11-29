import React from 'react';
import { Alert, AlertVariant, Stack } from '@grafana/ui';

interface ContactAdminAlertProps {
  title?: string;
  missingPermissions?: string[];
  severity?: AlertVariant;
}

export const ContactAdminAlert = ({
  title = 'Contact your administrator to get you started.',
  missingPermissions,
  severity = 'info',
}: ContactAdminAlertProps) => {
  return (
    <Alert title={title} severity={severity}>
      {missingPermissions && (
        <Stack>
          <div>You are missing the following permissions:</div>
          {missingPermissions.map((permission) => (
            <code key={permission}>{permission}</code>
          ))}
        </Stack>
      )}
    </Alert>
  );
};
