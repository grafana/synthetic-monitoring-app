import React, { useCallback, useEffect, useState } from 'react';
import { Collapse, Stack, Text, TextLink } from '@grafana/ui';
import { trackAgentSkillInstallCommandCopied, trackAgentSkillLinkClicked } from 'features/tracking/agentSkillEvents';

import { Clipboard } from 'components/Clipboard';
import { Feedback } from 'components/Feedback';

import { AgentSkillPrompts } from './AgentSkillPrompts';
import {
  AGENT_SKILL_DEFAULT_COPY,
  AGENT_SKILL_FEEDBACK_FEATURE,
  AGENT_SKILL_INSTALL_COMMANDS,
  AGENT_SKILL_REPO_URL,
  AGENT_SKILL_TERRAFORM_COPY,
  AgentSkillReferenceSource,
} from './AgentSkillReference.constants';
import { useAgentSkillFeedback, useTrackAgentSkillSectionViewed } from './AgentSkillReference.hooks';

const getCopy = (source: AgentSkillReferenceSource) =>
  source === 'terraform-tab' ? AGENT_SKILL_TERRAFORM_COPY : AGENT_SKILL_DEFAULT_COPY;

interface AgentSkillReferenceProps {
  source: AgentSkillReferenceSource;
  /** Render as a collapsed single line that expands in place. Use on dense pages. */
  collapsible?: boolean;
}

export const AgentSkillReference = ({ source, collapsible = false }: AgentSkillReferenceProps) => {
  const { askForFeedback, markInstallCopied, markFeedbackGiven } = useAgentSkillFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const trackView = useTrackAgentSkillSectionViewed(source);

  useEffect(() => {
    if (!collapsible) {
      trackView();
    }
  }, [collapsible, trackView]);

  const handleCopy = useCallback(
    (command: 'npx' | 'claude-plugin') => {
      markInstallCopied();
      trackAgentSkillInstallCommandCopied({ source, command });
    },
    [markInstallCopied, source]
  );

  const feedback = askForFeedback && (
    <Feedback
      feature={AGENT_SKILL_FEEDBACK_FEATURE}
      about={{ text: 'Did the skill help?' }}
      onReaction={markFeedbackGiven}
    />
  );

  const content = <AgentSkillReferenceContent source={source} onCopy={handleCopy} />;
  const { title } = getCopy(source);

  if (collapsible) {
    return (
      <Stack direction="column" gap={0.5}>
        <Collapse
          label={title}
          isOpen={isOpen}
          onToggle={() => {
            const nextIsOpen = !isOpen;
            setIsOpen(nextIsOpen);
            if (nextIsOpen) {
              trackView();
            }
          }}
        >
          {content}
        </Collapse>
        {feedback}
      </Stack>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Text variant="h4" element="h3">
          {title}
        </Text>
        {feedback}
      </Stack>
      {content}
    </Stack>
  );
};

interface AgentSkillReferenceContentProps {
  source: AgentSkillReferenceSource;
  onCopy: (command: 'npx' | 'claude-plugin') => void;
}

const AgentSkillReferenceContent = ({ source, onCopy }: AgentSkillReferenceContentProps) => (
  <Stack direction="column" gap={2}>
    <Text element="p">{getCopy(source).description}</Text>
    {AGENT_SKILL_INSTALL_COMMANDS.map(({ command, trackingId, label }) => (
      <Stack direction="column" gap={0.5} key={trackingId}>
        <Text element="p" color="secondary" variant="bodySmall">
          {label}
        </Text>
        <div data-fs-element={`Agent skill install command ${trackingId} (${source})`}>
          <Clipboard content={command} isCode inlineCopy onCopy={() => onCopy(trackingId)} />
        </div>
      </Stack>
    ))}
    <AgentSkillPrompts source={source} showIntro />
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
);
