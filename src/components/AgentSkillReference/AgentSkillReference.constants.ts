// Kept in sync with the inline source unions in features/tracking/agentSkillEvents.ts
// (the tracking lint rule disallows shared type aliases in event files).
export type AgentSkillReferenceSource =
  | 'docs-panel-scripted'
  | 'docs-panel-browser'
  | 'choose-check-type'
  | 'terraform-tab';

export const AGENT_SKILL_REPO_URL =
  'https://github.com/grafana/skills/tree/main/skills/grafana-cloud/synthetic-monitoring-checks';

export const AGENT_SKILL_INSTALL_COMMANDS = [
  {
    command: 'npx skills add grafana/skills',
    trackingId: 'npx' as const,
    label: 'Any Agent Skills compatible tool (Claude Code, Cursor, Codex, ...)',
  },
  {
    command: 'claude plugin install grafana-cloud@grafana-skills',
    trackingId: 'claude-plugin' as const,
    label: 'Claude Code plugin',
  },
];

// Set when the user copies an install command so return visits can ask for feedback.
export const AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY = 'synthetic-monitoring-agentSkillInstallCopied';

export const AGENT_SKILL_FEEDBACK_FEATURE = 'agent-skill';
