import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import {
  trackAgentSkillInstallCommandCopied,
  trackAgentSkillLinkClicked,
  trackAgentSkillToolSelected,
} from 'features/tracking/agentSkillEvents';

import { ChoiceTile, ChoiceTileGrid } from 'components/ChoiceTile';
import { Clipboard } from 'components/Clipboard';
import { Feedback } from 'components/Feedback';

import { AgentSkillPrompts } from './AgentSkillPrompts';
import {
  AGENT_SKILL_DEFAULT_COPY,
  AGENT_SKILL_FEEDBACK_FEATURE,
  AGENT_SKILL_REPO_URL,
  AGENT_SKILL_TOOLS,
  AgentSkillReferenceSource,
  AgentSkillToolId,
} from './AgentSkillReference.constants';
import { useAgentSkillFeedback, useTrackAgentSkillSectionViewed } from './AgentSkillReference.hooks';
import { ClaudeIcon } from './ClaudeIcon';

type AgentSkillTool = (typeof AGENT_SKILL_TOOLS)[number];

interface AgentSkillPickerProps {
  source: AgentSkillReferenceSource;
}

export const AgentSkillPicker = ({ source }: AgentSkillPickerProps) => {
  const styles = useStyles2(getStyles);
  const [selectedId, setSelectedId] = useState<AgentSkillToolId | null>(null);
  const { askForFeedback, markInstallCopied, markFeedbackGiven } = useAgentSkillFeedback();
  const trackView = useTrackAgentSkillSectionViewed(source);

  const selectedTool = AGENT_SKILL_TOOLS.find(({ id }) => id === selectedId);

  const handleSelect = useCallback(
    (tool: AgentSkillTool) => {
      if (selectedId === tool.id) {
        setSelectedId(null);
        return;
      }

      setSelectedId(tool.id);
      trackAgentSkillToolSelected({ source, tool: tool.id });
      trackView();
    },
    [selectedId, source, trackView]
  );

  return (
    <div className={styles.picker}>
      <Stack direction="row" alignItems="center" gap={1} wrap="wrap">
        <Text color="secondary">{AGENT_SKILL_DEFAULT_COPY.description}</Text>
        {askForFeedback && (
          <Feedback
            feature={AGENT_SKILL_FEEDBACK_FEATURE}
            about={{ text: 'Did the skill help?' }}
            onReaction={markFeedbackGiven}
          />
        )}
      </Stack>
      <ChoiceTileGrid>
        {AGENT_SKILL_TOOLS.map((tool) => (
          <li key={tool.id} data-fs-element={`Agent skill tool card ${tool.id} (${source})`}>
            <ChoiceTile
              title={tool.name}
              description={tool.cardDescription}
              icon={tool.id === 'claude-code' ? <ClaudeIcon /> : 'ai-sparkle'}
              selected={selectedId === tool.id}
              expanded={selectedId === tool.id}
              onClick={() => handleSelect(tool)}
            />
          </li>
        ))}
      </ChoiceTileGrid>
      {selectedTool && (
        <div className={styles.steps}>
          <Stack direction="column" gap={0.5}>
            <Text variant="h6" element="h2">
              1. Install the skill (one-time)
            </Text>
            <div data-fs-element={`Agent skill install command ${selectedTool.trackingId} (${source})`}>
              <Clipboard
                key={selectedTool.id}
                content={selectedTool.installCommand}
                isCode
                inlineCopy
                onCopy={() => {
                  markInstallCopied();
                  trackAgentSkillInstallCommandCopied({ source, command: selectedTool.trackingId });
                }}
              />
            </div>
          </Stack>
          <Stack direction="column" gap={0.5}>
            <Text variant="h6" element="h2">
              2. Tell your agent what to build
            </Text>
            <AgentSkillPrompts source={source} tool={selectedTool.id} />
          </Stack>
          <div>
            <TextLink
              href={AGENT_SKILL_REPO_URL}
              external
              onClick={() => trackAgentSkillLinkClicked({ source })}
              data-fs-element={`Agent skill repo link (${source})`}
            >
              View the skill on GitHub
            </TextLink>
          </div>
        </div>
      )}
    </div>
  );
};

// Install commands and prompts are prose-length; past this width they get hard to read.
const STEPS_MAX_WIDTH = 760;

const getStyles = (theme: GrafanaTheme2) => ({
  picker: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  steps: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    maxWidth: STEPS_MAX_WIDTH,
    paddingTop: theme.spacing(1),
  }),
});
