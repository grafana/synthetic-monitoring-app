import { createSMEventFactory } from 'features/tracking/utils';

const terraformEvents = createSMEventFactory('terraform');

/** Tracks when the terraform config tab is viewed. */
export const trackTerraformConfigViewed = terraformEvents('config_viewed');
