import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, AlertVariant, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

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
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.container}>
      <Alert title={title} severity={severity}>
        {missingPermissions && (
          <Stack direction={'column'}>
            You need the following permission(s):
            <Stack wrap={'nowrap'} direction={'column'}>
              {missingPermissions.map((permission) => (
                <code className={styles.permission} key={permission}>
                  {permission}
                </code>
              ))}
            </Stack>
          </Stack>
        )}
      </Alert>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    textAlign: 'left',
  }),

  permission: css({
    width: 'fit-content',
  }),
});
