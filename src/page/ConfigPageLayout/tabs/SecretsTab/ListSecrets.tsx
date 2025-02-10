import React from 'react';
import { Button } from '@grafana/ui';

import { useSecrets } from 'hooks/useSecrets';

import { ConfigContent } from '../../components/ConfigContent';
import { SecretsTable } from '../../components/SecretsTable';

export function ListSecrets() {
  const { data } = useSecrets();
  return (
    <ConfigContent title="Secrets">
      <ConfigContent.Section>
        <p>This tab allows you to manage secrets that are used in Synthetic Monitoring.</p>
        <Button>Add Secret</Button>
      </ConfigContent.Section>
      <ConfigContent.Section>
        <SecretsTable secrets={data} />
      </ConfigContent.Section>
    </ConfigContent>
  );
}
