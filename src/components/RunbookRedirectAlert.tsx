import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Box, Button, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import pluralize from 'pluralize';

import { Check, CheckAlertWithRunbookUrl } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

interface RunbookRedirectAlertProps {
  check: Check;
  alertConfig: CheckAlertWithRunbookUrl;
}

export const RunbookRedirectAlert = ({ check, alertConfig }: RunbookRedirectAlertProps) => {
  const runbookUrl = alertConfig.runbookUrl;
  const styles = useStyles2(getStyles);
  const [timeUntilRedirect, setTimeUntilRedirect] = useState<number | null>(5);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const redirectDisabled = timeUntilRedirect === null;

  const clearIntervalRef = useCallback(() => {
    if (interval.current) {
      clearInterval(interval.current);
    }
  }, []);

  useEffect(() => {
    interval.current = setInterval(() => {
      setTimeUntilRedirect((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      clearIntervalRef();
    };
  }, [clearIntervalRef]);

  useEffect(() => {
    if (timeUntilRedirect === null) {
      clearIntervalRef();
    }

    if (timeUntilRedirect === 0) {
      window.location.href = runbookUrl;

      clearIntervalRef();
    }
  }, [timeUntilRedirect, runbookUrl, clearIntervalRef]);

  const title = `Redirecting to runbook: ${runbookUrl}`;

  return (
    <div className={styles.container}>
      <Alert severity="info" title={title}>
        <Box marginTop={1}>
          <Stack direction="column" gap={2}>
            <Text>
              This redirect is for the alert: <Text weight="bold">{alertConfig.name}</Text>.
            </Text>
            <Text>
              It was triggered for the check:{' '}
              <Text weight="bold">
                {check.job} ({check.target})
              </Text>{' '}
              -{' '}
              <TextLink inline external href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })}>
                View dashboard
              </TextLink>
              .
            </Text>
            {!redirectDisabled && (
              <Text>
                Redirecting in {timeUntilRedirect} <strong>{pluralize('second', timeUntilRedirect)}</strong>.
              </Text>
            )}
            <Stack>
              <Button
                icon={timeUntilRedirect === 0 ? 'fa fa-spinner' : undefined}
                disabled={timeUntilRedirect === 0}
                variant="primary"
                onClick={() => setTimeUntilRedirect(0)}
              >
                Take me there now
              </Button>
              <Button variant="secondary" onClick={() => setTimeUntilRedirect(null)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Alert>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    maxWidth: '600px',
  }),
});
