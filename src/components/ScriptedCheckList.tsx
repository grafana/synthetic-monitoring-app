import { PluginPage } from '@grafana/runtime';
import { Alert, Button } from '@grafana/ui';
import { useNavigation } from 'hooks/useNavigation';
import React from 'react';
import { Check, ROUTES } from 'types';

export function ScriptedCheckList() {
  const navigate = useNavigation();
  const checks: Check[] = [];

  if (checks.length === 0) {
    return (
      <PluginPage pageNav={{ text: 'Scripted checks' }}>
        <Alert
          severity="info"
          title="Grafana Cloud Synthetic Monitoring"
          buttonContent={<span>New Check</span>}
          onRemove={() => navigate(`${ROUTES.ScriptedChecks}/new`)}
        >
          This account does not currently have any scripted checks configured. Click the New Check button to start
          monitoring your services with Grafana Cloud, or{' '}
          <a href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/">
            check out the Synthetic Monitoring docs.
          </a>
        </Alert>
      </PluginPage>
    );
  }

  return (
    <PluginPage pageNav={{ text: 'Scripted checks' }}>
      <Button onClick={() => navigate(`${ROUTES.ScriptedChecks}/new`)}>Add new</Button>
      <ul>
        {checks.map((check, index) => {
          return <li key={index}>{check.job}</li>;
        })}
      </ul>
    </PluginPage>
  );
}
