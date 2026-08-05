import React, { useState } from 'react';
import { RadioButtonGroup, Stack, Text } from '@grafana/ui';
import { trackAgentSkillPromptCopied } from 'features/tracking/agentSkillEvents';

import { Clipboard } from 'components/Clipboard';

import { AGENT_SKILL_PROMPTS, AgentSkillReferenceSource } from './AgentSkillReference.constants';

type AgentSkillPromptId = (typeof AGENT_SKILL_PROMPTS)[number]['id'];

interface AgentSkillPromptsProps {
  source: AgentSkillReferenceSource;
  tool?: 'claude-code' | 'agent-skills';
  /** Render the introductory line above the prompt block. */
  showIntro?: boolean;
}

export const AgentSkillPrompts = ({ source, tool, showIntro = false }: AgentSkillPromptsProps) => {
  const prompts = AGENT_SKILL_PROMPTS.filter(({ sources }) => sources.includes(source));
  const [promptId, setPromptId] = useState<AgentSkillPromptId>(prompts[0].id);

  const selectedPrompt = prompts.find(({ id }) => id === promptId) ?? prompts[0];

  return (
    <Stack direction="column" gap={0.5}>
      {showIntro && (
        <Text element="p" color="secondary" variant="bodySmall">
          {prompts.length > 1
            ? 'Then tell your agent what you need — start from one of these prompts:'
            : 'Then tell your agent what you need — start from this prompt:'}
        </Text>
      )}
      {prompts.length > 1 && (
        <div>
          <RadioButtonGroup
            options={prompts.map(({ id, label }) => ({ value: id, label }))}
            value={selectedPrompt.id}
            onChange={setPromptId}
            size="sm"
          />
        </div>
      )}
      <div data-fs-element={`Agent skill example prompt ${selectedPrompt.id} (${source})`}>
        <Clipboard
          key={selectedPrompt.id}
          content={selectedPrompt.prompt}
          isCode
          inlineCopy
          onCopy={() => trackAgentSkillPromptCopied({ source, tool, prompt: selectedPrompt.id })}
        />
      </div>
    </Stack>
  );
};
