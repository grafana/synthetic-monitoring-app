import React from 'react';
import { Button, EmptyState } from '@grafana/ui';

import { ConfigContent } from 'page/ConfigPageLayout';

export function SecretsManagementTab() {
  const handleCallToAction = () => {};
  const emptyState = true;
  if (emptyState) {
    return (
      <ConfigContent>
        <EmptyState
          variant="call-to-action"
          message="You don't have any secrets yet."
          button={
            <Button onClick={handleCallToAction} icon="plus">
              Create secret
            </Button>
          }
        >
          You can use secrets to store sensitive information such as passwords, API keys, and other sensitive
          information.
        </EmptyState>
      </ConfigContent>
    );
  }

  return (
    <ConfigContent
      title="Secrets management"
      actions={
        <div>
          <Button size="sm" icon="plus">
            Create secret
          </Button>
        </div>
      }
    >
      <div>
        <p>
          Secrets is a way to store and manage secrets in Grafana Cloud. You can use secrets to store sensitive
          information such as passwords, API keys, and other sensitive information.
        </p>
      </div>
      <ConfigContent.Section title="Secrets"></ConfigContent.Section>
    </ConfigContent>
  );
}
