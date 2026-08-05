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

import {
  AGENT_SKILL_FEEDBACK_FEATURE,
  AGENT_SKILL_INSTALL_COMMANDS,
  AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
  AGENT_SKILL_REPO_URL,
  AgentSkillReferenceSource,
} from './AgentSkillReference.constants';

const TITLE = 'Author checks with your AI coding agent';

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

  const feedback = hasCopiedInstall && (
    <Feedback feature={AGENT_SKILL_FEEDBACK_FEATURE} about={{ text: 'Did the skill help?' }} />
  );

  const content = <AgentSkillReferenceContent source={source} onCopy={handleCopy} />;

  if (collapsible) {
    return (
      <Stack direction="column" gap={0.5}>
        <Collapse
          label={TITLE}
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
          {TITLE}
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
    <Text element="p">
      The Synthetic Monitoring skill teaches AI coding agents to pick the simplest sufficient check type, author
      scripted and browser checks that assert correctly, and validate them locally with <code>k6 run</code>. Paste the
      resulting script into the editor here, or let your agent deploy it via Terraform or the API.
    </Text>
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
