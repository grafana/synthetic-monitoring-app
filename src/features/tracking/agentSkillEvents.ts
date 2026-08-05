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

/** Tracks when the agent skill reference content is shown: on render in the docs panels, on first expand on collapsible surfaces (choose-check-type, terraform-tab). */
export const trackAgentSkillSectionViewed = agentSkillEvents<AgentSkillEvent>('section_viewed');

/** Tracks when the agent skill repository link is clicked. */
export const trackAgentSkillLinkClicked = agentSkillEvents<AgentSkillEvent>('link_clicked');

/** Tracks when one of the agent skill install commands is copied to the clipboard. */
export const trackAgentSkillInstallCommandCopied =
  agentSkillEvents<AgentSkillInstallCommandEvent>('install_command_copied');
