import { createSMEventFactory } from 'features/tracking/utils';

const probeEvents = createSMEventFactory('probes');

/** Tracks when a private probe is created. */
export const trackProbeCreated = probeEvents('probe_created');

/** Tracks when a private probe is updated. */
export const trackProbeUpdated = probeEvents('probe_updated');

/** Tracks when a private probe is deleted. */
export const trackProbeDeleted = probeEvents('probe_deleted');

/** Tracks when a private probe's token is reset. */
export const trackProbeTokenReset = probeEvents('probe_token_reset');
