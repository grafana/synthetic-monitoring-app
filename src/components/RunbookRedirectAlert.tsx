import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface RunbookRedirectAlertProps {
  runbookUrl: string;
}

function redirectToRunbook(runbookUrl: string) {
  window.location.href = runbookUrl;
}

export const RunbookRedirectAlert: React.FC<RunbookRedirectAlertProps> = ({ runbookUrl }) => {
  const styles = useStyles2(getStyles);

  redirectToRunbook(runbookUrl);
  return (
    <div className={styles.container}>
      <Alert severity="info" title="Redirecting to runbook">
        <Stack direction="column" gap={2} alignItems="flex-start">
          <Text>Redirecting to {runbookUrl}</Text>
          <Button variant="primary" onClick={() => redirectToRunbook(runbookUrl)}>
            Take me there now
          </Button>
        </Stack>
      </Alert>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    maxWidth: '600px',
  }),
});
