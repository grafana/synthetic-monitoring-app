import { formatDuration } from 'utils';

export const MIGRATION_COOLDOWN_MS = 70 * 60 * 1000;

const MINUTE_MS = 60 * 1000;

type MigrationCooldown = { isCoolingDown: false } | { isCoolingDown: true; message: string };

// tenant.modified is bumped by the label-mode transition itself, so it doubles
// as "time of last transition" without needing a dedicated timestamp. The
// cooldown only gates finalizing (DUAL_WRITE -> UNPREFIXED); the remaining time
// is rounded up to whole minutes because the message is static, not a countdown.
export function getMigrationCooldown(tenantModifiedSeconds: number | undefined, nowMs: number): MigrationCooldown {
  if (tenantModifiedSeconds === undefined) {
    return { isCoolingDown: false };
  }

  const remainingMs = MIGRATION_COOLDOWN_MS - (nowMs - tenantModifiedSeconds * 1000);

  if (remainingMs <= 0) {
    return { isCoolingDown: false };
  }

  const wholeMinutesMs = Math.ceil(remainingMs / MINUTE_MS) * MINUTE_MS;

  return { isCoolingDown: true, message: `You can change your label mode in ${formatDuration(wholeMinutesMs)}` };
}
