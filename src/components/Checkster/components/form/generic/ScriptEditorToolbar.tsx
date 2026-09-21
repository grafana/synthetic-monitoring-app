import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Modal, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';
import { AgentSkillPicker } from 'components/AgentSkillReference/AgentSkillPicker';
import { K6ChannelSelect } from 'components/CheckEditor/FormComponents/K6ChannelSelect';
import { useChecksterContext } from 'components/Checkster/contexts/ChecksterContext';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { ScriptingHelpMenu } from './ScriptingHelpMenu';

interface ScriptEditorToolbarProps {
  examples?: ExampleScript[];
  onRequestLoadExample: (example: ExampleScript) => void;
  onExpand: () => void;
}

export function ScriptEditorToolbar({ examples, onRequestLoadExample, onExpand }: ScriptEditorToolbarProps) {
  const styles = useStyles2(getStyles);
  const [isAgentSetupOpen, setIsAgentSetupOpen] = useState(false);
  const { checkType } = useChecksterContext();
  const isBrowser = checkType === CheckType.Browser;
  const scriptKind = isBrowser ? 'browser script' : 'script';
  const agentSkillSource = isBrowser ? 'script-editor-toolbar-browser' : 'script-editor-toolbar-scripted';

  return (
    <div className={styles.toolbar}>
      <div className={styles.leftGroup}>
        <K6ChannelSelect />
        <ScriptingHelpMenu examples={examples} onRequestLoadExample={onRequestLoadExample} />
      </div>
      <div className={styles.rightGroup}>
        <Button
          type="button"
          variant="secondary"
          fill="outline"
          icon="ai-sparkle"
          className={styles.agentSetupButton}
          aria-label="Generate with AI"
          tooltip="Generate with AI"
          onClick={() => setIsAgentSetupOpen(true)}
        >
          Generate with AI
        </Button>
        <Button
          type="button"
          variant="secondary"
          fill="text"
          icon="expand-arrows-alt"
          className={styles.expandButton}
          aria-label="Expand editor"
          tooltip="Expand editor"
          onClick={onExpand}
        />
      </div>

      <Modal isOpen={isAgentSetupOpen} title="Generate with AI" onDismiss={() => setIsAgentSetupOpen(false)}>
        <Stack direction="column" gap={2}>
          <Text color="secondary">Use our skill in your local coding agent to generate a {scriptKind}.</Text>
          <AgentSkillPicker source={agentSkillSource} title={null} showDescription={false} showFeedback={false} />
        </Stack>
      </Modal>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    toolbar: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(1, 1)};
      background-color: ${theme.colors.background.primary};
      border-bottom: 1px solid ${theme.colors.border.weak};
      border-top-left-radius: ${theme.shape.radius.default};
      border-top-right-radius: ${theme.shape.radius.default};
    `,
    leftGroup: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
    `,
    rightGroup: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(0.5)};
    `,
    agentSetupButton: css`
      & svg {
        color: #ff8833;
      }
    `,
    expandButton: css`
      margin-left: ${theme.spacing(0.5)};
    `,
  };
}
