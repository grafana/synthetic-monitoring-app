import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Card, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import {
  trackAgentSkillInstallCommandCopied,
  trackAgentSkillLinkClicked,
  trackAgentSkillToolSelected,
} from 'features/tracking/agentSkillEvents';

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
      setSelectedId(tool.id);
      trackAgentSkillToolSelected({ source, tool: tool.id });
      trackView();
    },
    [source, trackView]
  );

  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Text variant="body" weight="medium" element="h3">
          Or author checks with your coding agent
        </Text>
        {askForFeedback && (
          <Feedback
            feature={AGENT_SKILL_FEEDBACK_FEATURE}
            about={{ text: 'Did the skill help?' }}
            onReaction={markFeedbackGiven}
          />
        )}
      </Stack>
      <div className={styles.cardRow}>
        {AGENT_SKILL_TOOLS.map((tool) => (
          <div key={tool.id} data-fs-element={`Agent skill tool card ${tool.id} (${source})`}>
            <Card
              noMargin
              isSelected={selectedId === tool.id}
              onClick={() => handleSelect(tool)}
              className={styles.toolCard}
            >
              <Card.Heading>{tool.name}</Card.Heading>
              <Card.Description>{tool.cardDescription}</Card.Description>
            </Card>
          </div>
        ))}
      </div>
      {selectedTool && (
        <Stack direction="column" gap={2}>
          <Text element="p" color="secondary">
            {AGENT_SKILL_DEFAULT_COPY.description}
          </Text>
          <Stack direction="column" gap={0.5}>
            <Text variant="h6" element="h4">
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
            <Text variant="h6" element="h4">
              2. Describe what you want monitored
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
      )}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  cardRow: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: theme.spacing(2),
  }),
  toolCard: css({
    height: '100%',
  }),
});
