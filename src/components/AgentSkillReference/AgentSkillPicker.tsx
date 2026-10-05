import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Stack, styleMixins, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import {
  trackAgentSkillInstallCommandCopied,
  trackAgentSkillLinkClicked,
  trackAgentSkillToolSelected,
} from 'features/tracking/agentSkillEvents';

import { Card } from 'components/Card';
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
    <Stack direction="column" gap={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        <div>Create checks with your coding agent</div>
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
            <Card className={cx(styles.toolCard, selectedId === tool.id && styles.toolCardSelected)}>
              <Stack alignItems="flex-start" direction="column" gap={1}>
                <Stack alignItems="center" direction="row" gap={1}>
                  {tool.id === 'claude-code' && <ClaudeIcon />}
                  {tool.id === 'agent-skills' && <Icon name="ai-sparkle" size="lg" aria-hidden="true" />}
                  <Card.Heading variant="h5">
                    <button
                      type="button"
                      className={styles.action}
                      aria-expanded={selectedId === tool.id}
                      onClick={() => handleSelect(tool)}
                    >
                      {tool.name}
                    </button>
                  </Card.Heading>
                </Stack>
                <Text color="secondary">{tool.cardDescription}</Text>
              </Stack>
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
  action: css({
    all: 'unset',
    '&::after': {
      content: "''",
      position: 'absolute',
      inset: 0,
      borderRadius: theme.shape.radius.default,
      cursor: 'pointer',
    },
    '&:focus-visible::after': styleMixins.getFocusStyles(theme),
  }),
  toolCard: css({
    height: '100%',
    minWidth: 0,
    textAlign: 'left',
  }),
  toolCardSelected: css({
    boxShadow: `inset 0 0 0 1px ${theme.colors.primary.border}`,
  }),
});
