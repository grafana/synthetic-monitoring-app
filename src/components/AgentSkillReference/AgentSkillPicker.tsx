import React, { useCallback, useState } from 'react';
import { Box, Stack, Text, TextLink } from '@grafana/ui';
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

// Install commands and prompts are prose-length; past this width they get hard to read.
// In theme spacing units: 760px.
const STEPS_MAX_WIDTH = 95;

interface AgentSkillPickerProps {
  source: AgentSkillReferenceSource;
}

export const AgentSkillPicker = ({ source }: AgentSkillPickerProps) => {
  const [selectedId, setSelectedId] = useState<AgentSkillToolId | null>(null);
  const { askForFeedback, markInstallCopied, markFeedbackGiven } = useAgentSkillFeedback();
  const trackView = useTrackAgentSkillSectionViewed(source);

  const selectedTool = AGENT_SKILL_TOOLS.find(({ id }) => id === selectedId);

  const handleSelect = useCallback(
    (tool: AgentSkillTool) => {
      // The tools are mutually exclusive choices, so picking the current one again changes nothing.
      if (selectedId === tool.id) {
        return;
      }

      setSelectedId(tool.id);
      trackAgentSkillToolSelected({ source, tool: tool.id });
      trackView();
    },
    [selectedId, source, trackView]
  );

  return (
    <Stack direction="column" gap={2}>
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
          <ChoiceTile
            key={tool.id}
            data-fs-element={`Agent skill tool card ${tool.id} (${source})`}
            title={tool.name}
            description={tool.cardDescription}
            icon={tool.id === 'claude-code' ? <ClaudeIcon /> : 'ai-sparkle'}
            selected={selectedId === tool.id}
            onClick={() => handleSelect(tool)}
          />
        ))}
      </ChoiceTileGrid>
      {selectedTool && (
        <Box paddingTop={1}>
          <Stack direction="column" gap={2} maxWidth={STEPS_MAX_WIDTH}>
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
          </Stack>
        </Box>
      )}
    </Stack>
  );
};
