// Kept in sync with the inline source unions in features/tracking/agentSkillEvents.ts.
// The unions are duplicated there on purpose: features/tracking is a leaf layer and
// should not import from components/, so the event file cannot share this alias.
export type AgentSkillReferenceSource =
  | 'docs-panel-scripted'
  | 'docs-panel-browser'
  | 'choose-check-type'
  | 'terraform-tab';

export const AGENT_SKILL_REPO_URL =
  'https://github.com/grafana/skills/tree/main/skills/grafana-cloud/synthetic-monitoring-checks';

export const AGENT_SKILL_TOOLS = [
  {
    id: 'claude-code' as const,
    trackingId: 'claude-plugin' as const,
    name: 'Claude Code',
    cardDescription: 'Install the Synthetic Monitoring skill as a Claude Code plugin.',
    installCommand: 'claude plugin install grafana-cloud@grafana-skills',
    installLabel: 'Claude Code plugin',
  },
  {
    id: 'agent-skills' as const,
    trackingId: 'npx' as const,
    name: 'Cursor, Codex & other agents',
    cardDescription: 'Install via the Agent Skills CLI — works with any compatible coding agent.',
    installCommand: 'npx skills add grafana/skills',
    installLabel: 'Any Agent Skills compatible tool (Claude Code, Cursor, Codex, ...)',
  },
];

export type AgentSkillToolId = (typeof AGENT_SKILL_TOOLS)[number]['id'];

export const AGENT_SKILL_INSTALL_COMMANDS = AGENT_SKILL_TOOLS.map(({ installCommand, trackingId, installLabel }) => ({
  command: installCommand,
  trackingId,
  label: installLabel,
}));

export const AGENT_SKILL_PROMPTS: Array<{
  id: 'site' | 'api-spec' | 'terraform-import';
  label: string;
  prompt: string;
  sources: AgentSkillReferenceSource[];
}> = [
  {
    id: 'site',
    label: 'From your site',
    prompt: `Create Grafana Cloud Synthetic Monitoring checks for <your site URL>. The journey that matters most is: <e.g. login → view account → transfer>. Explore the target yourself — pages and any /api/* routes — to find endpoints and stable selectors, and only ask me what you can't discover. Choose the simplest sufficient check type, keep anything touching production read-only or self-cleaning, and validate scripts locally with k6 run, passing several times in a row, before giving me something I can deploy.`,
    sources: ['docs-panel-scripted', 'docs-panel-browser', 'choose-check-type'],
  },
  {
    id: 'api-spec',
    label: 'From an API spec',
    prompt: `Create Grafana Cloud Synthetic Monitoring checks from my API spec: <path or URL to OpenAPI/Swagger/Postman file>. The production base URL is <https://api.example.com> — verify it, don't trust the spec's servers list. Don't monitor every endpoint: pick the 1–3 journeys whose failure means customers are impacted and write one check per journey, asserting the fields the response schemas promise. Only include mutating operations if the journey cleans up after itself, map any credentials to SM secrets rather than inlining them, and validate scripts locally with k6 run, passing several times in a row, before giving me something I can deploy.`,
    sources: ['docs-panel-scripted', 'docs-panel-browser', 'choose-check-type'],
  },
  {
    id: 'terraform-import',
    label: 'Adopt existing checks',
    prompt: `Using the Grafana Cloud Synthetic Monitoring Terraform export below, please create the proper Terraform files for me: a maintainable layout with provider auth via variables and no inlined tokens or secrets. Run the import commands and confirm terraform plan shows no changes, so my live checks aren't modified or recreated.

<paste the exported config and import commands from this page>`,
    sources: ['terraform-tab'],
  },
];

export const AGENT_SKILL_DEFAULT_COPY = {
  title: 'Author checks with your coding agent',
  description:
    'The Synthetic Monitoring skill teaches coding agents to pick the simplest sufficient check type, author scripted and browser checks that assert correctly, and validate them locally with k6 run. Paste the resulting script into the check editor, or let your agent deploy it via Terraform or the API.',
};

export const AGENT_SKILL_TERRAFORM_COPY = {
  title: 'Use your coding agent to create Terraform files for your existing checks',
  description:
    'The Synthetic Monitoring skill teaches coding agents to turn the export on this page into a maintainable Terraform project — imported cleanly, with no changes to your live checks — and to author and validate future checks as code.',
};

// Set when the user copies an install command so return visits can ask for feedback.
export const AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY = 'synthetic-monitoring-agentSkillInstallCopied';

// Set once the user reacts to the "Did the skill help?" ask so we stop asking.
export const AGENT_SKILL_FEEDBACK_GIVEN_STORAGE_KEY = 'synthetic-monitoring-agentSkillFeedbackGiven';

export const AGENT_SKILL_FEEDBACK_FEATURE = 'agent-skill';
