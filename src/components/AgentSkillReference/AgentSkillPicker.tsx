import React, { useCallback, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import {
  trackAgentSkillInstallCommandCopied,
  trackAgentSkillLinkClicked,
  trackAgentSkillSectionViewed,
  trackAgentSkillToolSelected,
} from 'features/tracking/agentSkillEvents';
import { useLocalStorage } from 'usehooks-ts';

import { Clipboard } from 'components/Clipboard';
import { Feedback } from 'components/Feedback';

import { AgentSkillPrompts } from './AgentSkillPrompts';
import {
  AGENT_SKILL_FEEDBACK_FEATURE,
  AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
  AGENT_SKILL_REPO_URL,
  AGENT_SKILL_TOOLS,
  AgentSkillReferenceSource,
} from './AgentSkillReference.constants';

type AgentSkillTool = (typeof AGENT_SKILL_TOOLS)[number];

interface AgentSkillPickerProps {
  source: AgentSkillReferenceSource;
}

export const AgentSkillPicker = ({ source }: AgentSkillPickerProps) => {
  const styles = useStyles2(getStyles);
  const [selectedId, setSelectedId] = useState<AgentSkillTool['id'] | null>(null);
  const [hasCopiedInstall, setHasCopiedInstall] = useLocalStorage<boolean>(
    AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
    false
  );
  // Ask for feedback only on return visits: snapshot the flag at mount so a
  // copy in the current session doesn't trigger the ask before the skill has
  // actually been tried.
  const [askForFeedback] = useState(hasCopiedInstall);
  const hasTrackedView = useRef(false);

  const selectedTool = AGENT_SKILL_TOOLS.find(({ id }) => id === selectedId);

  const handleSelect = useCallback(
    (tool: AgentSkillTool) => {
      setSelectedId(tool.id);
      trackAgentSkillToolSelected({ source, tool: tool.id });
      if (!hasTrackedView.current) {
        hasTrackedView.current = true;
        trackAgentSkillSectionViewed({ source });
      }
    },
    [source]
  );

  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Text variant="h5" element="h3">
          Or author checks with your coding agent
        </Text>
        {askForFeedback && (
          <Feedback feature={AGENT_SKILL_FEEDBACK_FEATURE} about={{ text: 'Did the skill help?' }} />
        )}
      </Stack>
      <div className={styles.cardRow}>
        {AGENT_SKILL_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={cx(styles.toolCard, { [styles.toolCardSelected]: selectedId === tool.id })}
            onClick={() => handleSelect(tool)}
            aria-pressed={selectedId === tool.id}
            data-fs-element={`Agent skill tool card ${tool.id} (${source})`}
          >
            <Text variant="h6" element="h4">
              {tool.name}
            </Text>
            <Text color="secondary" variant="bodySmall">
              {tool.cardDescription}
            </Text>
          </button>
        ))}
      </div>
      {selectedTool && (
        <Stack direction="column" gap={2}>
          <Text element="p" color="secondary">
            The Synthetic Monitoring skill teaches your agent to pick the simplest sufficient check type, author
            scripted and browser checks that assert correctly, and validate them locally with <code>k6 run</code>.
            Paste the resulting script into the check editor, or let your agent deploy it via Terraform or the API.
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
                  setHasCopiedInstall(true);
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: theme.spacing(2),
  }),
  toolCard: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    padding: theme.spacing(2),
    textAlign: 'left',
    background: theme.colors.background.secondary,
    border: `1px solid transparent`,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',

    '&:hover': {
      background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
    },
  }),
  toolCardSelected: css({
    borderColor: theme.colors.primary.border,
  }),
});
