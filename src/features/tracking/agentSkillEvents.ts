import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const agentSkillEvents = createSMEventFactory('agent_skill');

interface AgentSkillEvent extends TrackingEventProps {
  /** Where in the app the agent skill reference was interacted with. */
  source: 'docs-panel-scripted' | 'docs-panel-browser' | 'choose-check-type' | 'terraform-tab';
}

interface AgentSkillInstallCommandEvent extends TrackingEventProps {
  /** Where in the app the agent skill reference was interacted with. */
  source: 'docs-panel-scripted' | 'docs-panel-browser' | 'choose-check-type' | 'terraform-tab';
  /** Which install command was copied. */
  command: 'npx' | 'claude-plugin';
}

interface AgentSkillToolEvent extends TrackingEventProps {
  /** Where in the app the agent skill reference was interacted with. */
  source: 'docs-panel-scripted' | 'docs-panel-browser' | 'choose-check-type' | 'terraform-tab';
  /** Which coding agent tool card the user selected. */
  tool: 'claude-code' | 'agent-skills';
}

interface AgentSkillPromptEvent extends TrackingEventProps {
  /** Where in the app the agent skill reference was interacted with. */
  source: 'docs-panel-scripted' | 'docs-panel-browser' | 'choose-check-type' | 'terraform-tab';
  /** Which coding agent tool card the user selected. Absent on surfaces without a tool picker. */
  tool?: 'claude-code' | 'agent-skills';
  /** Which example prompt variant was copied. */
  prompt: 'site' | 'api-spec' | 'terraform-import';
}

/** Tracks when the agent skill reference content is shown: on render in the docs panels, on first reveal (expand or tool selection) elsewhere. */
export const trackAgentSkillSectionViewed = agentSkillEvents<AgentSkillEvent>('section_viewed');

/** Tracks when the agent skill repository link is clicked. */
export const trackAgentSkillLinkClicked = agentSkillEvents<AgentSkillEvent>('link_clicked');

/** Tracks when one of the agent skill install commands is copied to the clipboard. */
export const trackAgentSkillInstallCommandCopied =
  agentSkillEvents<AgentSkillInstallCommandEvent>('install_command_copied');

/** Tracks when a coding agent tool card is selected in the agent skill picker. */
export const trackAgentSkillToolSelected = agentSkillEvents<AgentSkillToolEvent>('tool_selected');

/** Tracks when one of the example authoring prompts is copied to the clipboard. */
export const trackAgentSkillPromptCopied = agentSkillEvents<AgentSkillPromptEvent>('prompt_copied');
