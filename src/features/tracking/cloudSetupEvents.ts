import { createSMEventFactory } from 'features/tracking/utils';

const cloudSetupEvents = createSMEventFactory('cloud_setup');

/** Tracks when the cloud-setup CLI panel is shown, once per mount. */
export const trackCloudSetupCliPanelShown = cloudSetupEvents('cli_panel_shown');

/** Tracks when the cloud-setup CLI command is copied to the clipboard. */
export const trackCloudSetupCliCommandCopied = cloudSetupEvents('cli_command_copied');

/** Tracks when a user expands the coding-agent instructions. */
export const trackCloudSetupAgentPromptShown = cloudSetupEvents('agent_prompt_shown');

/** Tracks a successful copy separately from the setup wizard command. */
export const trackCloudSetupAgentPromptCopied = cloudSetupEvents('agent_prompt_copied');
