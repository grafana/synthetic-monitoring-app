import { createSMEventFactory } from 'features/tracking/utils';

const cloudSetupEvents = createSMEventFactory('cloud_setup');

/** Tracks when the cloud-setup CLI command is copied to the clipboard. */
export const trackCloudSetupCliCommandCopied = cloudSetupEvents('cli_command_copied');
