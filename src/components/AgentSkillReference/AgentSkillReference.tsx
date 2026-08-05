import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Collapse, Stack, Text, TextLink } from '@grafana/ui';
import {
  trackAgentSkillInstallCommandCopied,
  trackAgentSkillLinkClicked,
  trackAgentSkillSectionViewed,
} from 'features/tracking/agentSkillEvents';
import { useLocalStorage } from 'usehooks-ts';

import { Clipboard } from 'components/Clipboard';
import { Feedback } from 'components/Feedback';

import { AgentSkillPrompts } from './AgentSkillPrompts';
import {
  AGENT_SKILL_DEFAULT_COPY,
  AGENT_SKILL_FEEDBACK_FEATURE,
  AGENT_SKILL_INSTALL_COMMANDS,
  AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
  AGENT_SKILL_REPO_URL,
  AGENT_SKILL_TERRAFORM_COPY,
  AgentSkillReferenceSource,
} from './AgentSkillReference.constants';

const getCopy = (source: AgentSkillReferenceSource) =>
  source === 'terraform-tab' ? AGENT_SKILL_TERRAFORM_COPY : AGENT_SKILL_DEFAULT_COPY;

interface AgentSkillReferenceProps {
  source: AgentSkillReferenceSource;
  /** Render as a collapsed single line that expands in place. Use on dense pages. */
  collapsible?: boolean;
}

export const AgentSkillReference = ({ source, collapsible = false }: AgentSkillReferenceProps) => {
  const [hasCopiedInstall, setHasCopiedInstall] = useLocalStorage<boolean>(
    AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
    false
  );
  // Ask for feedback only on return visits: snapshot the flag at mount so a
  // copy in the current session doesn't trigger the ask before the skill has
  // actually been tried.
  const [askForFeedback] = useState(hasCopiedInstall);
  const [isOpen, setIsOpen] = useState(false);
  const hasTrackedView = useRef(false);

  const trackView = useCallback(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackAgentSkillSectionViewed({ source });
    }
  }, [source]);

  useEffect(() => {
    if (!collapsible) {
      trackView();
    }
  }, [collapsible, trackView]);

  const handleCopy = useCallback(
    (command: 'npx' | 'claude-plugin') => {
      setHasCopiedInstall(true);
      trackAgentSkillInstallCommandCopied({ source, command });
    },
    [setHasCopiedInstall, source]
  );

  const feedback = askForFeedback && (
    <Feedback feature={AGENT_SKILL_FEEDBACK_FEATURE} about={{ text: 'Did the skill help?' }} />
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
