import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { SyntheticsBuilder } from '@grafana/k6-test-builder';
import { useTheme2 } from '@grafana/ui';

export function ScriptedChecksPage() {
  const theme = useTheme2();
  const handleSubmit = (values: any, errors: any) => {
    console.log({ values, errors });
  };
  return (
    <PluginPage pageNav={{ text: 'Scripted checks', description: 'List of checks' }}>
      <SyntheticsBuilder theme={theme} onSubmit={handleSubmit} />
    </PluginPage>
  );
}
