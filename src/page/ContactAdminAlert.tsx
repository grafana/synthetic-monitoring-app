import React from 'react';
import { Alert, Stack } from '@grafana/ui';

export const ContactAdminAlert = ({ permissions }: { permissions?: string[] }) => {
  return (
    <Alert title="Contact your administrator to get you started." severity="info">
      {permissions && (
        <Stack>
          <div>You are missing the following permissions:</div>
          {permissions.map((permission) => (
            <code key="permission">{permission}</code>
          ))}
        </Stack>
      )}
    </Alert>
  );
};
