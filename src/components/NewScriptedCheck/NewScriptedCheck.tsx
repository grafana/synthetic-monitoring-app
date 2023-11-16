import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import { PluginPage } from '@grafana/runtime';
import { Card, HorizontalGroup, LinkButton, VerticalGroup } from '@grafana/ui';

import { ScriptEditorIllustration } from './ScriptEditorIllustration';
import { TestBuilderIllustration } from './TestBuilderIllustration';

export function NewScriptedCheck() {
  const { path } = useRouteMatch();
  return (
    <PluginPage pageNav={{ text: 'New check' }}>
      <HorizontalGroup justify="center" wrap={true}>
        <HorizontalGroup>
          <Card>
            <HorizontalGroup>
              <VerticalGroup>
                <h3>Test Builder</h3>
                <p>Use our interactive UI to compose GET, POST, PUT, PATCH, DELETE, HEAD and OPTIONS requests.</p>
                <LinkButton href={`${path}/builder`}>Start Building</LinkButton>
              </VerticalGroup>
              <HorizontalGroup>
                <TestBuilderIllustration />
              </HorizontalGroup>
            </HorizontalGroup>
          </Card>
          <Card>
            <HorizontalGroup>
              <VerticalGroup>
                <h3>Script Editor</h3>
                <p>Use our code samples as a foundation for your script or start from a clean slate.</p>
                <LinkButton href={`${path}/script-editor`}>Start Scripting</LinkButton>
              </VerticalGroup>
              <HorizontalGroup>
                <ScriptEditorIllustration />
              </HorizontalGroup>
            </HorizontalGroup>
          </Card>
        </HorizontalGroup>
      </HorizontalGroup>
    </PluginPage>
  );
}
