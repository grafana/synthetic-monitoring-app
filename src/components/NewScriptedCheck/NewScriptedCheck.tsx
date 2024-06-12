import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { PluginPage } from '@grafana/runtime';
import { Card, LinkButton, Stack } from '@grafana/ui';

import { ScriptEditorIllustration } from './ScriptEditorIllustration';
import { TestBuilderIllustration } from './TestBuilderIllustration';

export function NewScriptedCheck() {
  const { path } = useRouteMatch();
  return (
    <PluginPage pageNav={{ text: 'New check' }}>
      <Stack justifyContent="center" wrap="wrap">
        <Stack>
          <Card>
            <Stack>
              <Stack direction={'column'}>
                <h3>Test Builder</h3>
                <p>Use our interactive UI to compose GET, POST, PUT, PATCH, DELETE, HEAD and OPTIONS requests.</p>
                <LinkButton href={`${path}/builder`}>Start Building</LinkButton>
              </Stack>
              <Stack>
                <TestBuilderIllustration />
              </Stack>
            </Stack>
          </Card>
          <Card>
            <Stack>
              <Stack direction={'column'}>
                <h3>Script Editor</h3>
                <p>Use our code samples as a foundation for your script or start from a clean slate.</p>
                <LinkButton href={`${path}/script-editor`}>Start Scripting</LinkButton>
              </Stack>
              <Stack>
                <ScriptEditorIllustration />
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </PluginPage>
  );
}
