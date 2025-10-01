import React from 'react';
import { PluginPage } from '@grafana/runtime';

import { Checkster } from '../Checkster';

export function DevChecksterPage() {
  return (
    <PluginPage>
      <Checkster
        onSave={(payload) => {
          console.log('Checkster.onSave', payload);
          return Promise.resolve();
        }}
      />
    </PluginPage>
  );
}
