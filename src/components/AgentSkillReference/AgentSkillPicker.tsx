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
  /** Heading shown above the tool cards. Defaults to phrasing that assumes this follows another option. Pass `null` to hide it (e.g. when the surrounding UI already has its own title). */
  title?: string | null;
  /** Shows the "what the skill does" blurb once a tool is selected. Off when the surrounding UI already explains that. */
  showDescription?: boolean;
  /** Shows the "Did the skill help?" feedback ask once a tool is selected. */
  showFeedback?: boolean;
}

export const AgentSkillPicker = ({
  source,
  title = 'Or author checks with your coding agent',
  showDescription = true,
  showFeedback = true,
}: AgentSkillPickerProps) => {
  const styles = useStyles2(getStyles);
  const [selectedId, setSelectedId] = useState<AgentSkillToolId | null>(null);
  const { askForFeedback: canAskForFeedback, markInstallCopied, markFeedbackGiven } = useAgentSkillFeedback();
  const askForFeedback = showFeedback && canAskForFeedback;
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
      {title && (
        <Text variant="body" weight="medium" element="h3">
          {title}
        </Text>
      )}
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
          {showDescription && (
            <Text element="p" color="secondary">
              {AGENT_SKILL_DEFAULT_COPY.description}
            </Text>
          )}
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
              2. Tell your agent what to build
            </Text>
            <AgentSkillPrompts source={source} tool={selectedTool.id} />
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <TextLink
              href={AGENT_SKILL_REPO_URL}
              external
              onClick={() => trackAgentSkillLinkClicked({ source })}
              data-fs-element={`Agent skill repo link (${source})`}
            >
              View the skill on GitHub
            </TextLink>
            {askForFeedback && (
              <Feedback
                feature={AGENT_SKILL_FEEDBACK_FEATURE}
                about={{ text: 'Did the skill help?' }}
                onReaction={markFeedbackGiven}
              />
            )}
          </Stack>
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
