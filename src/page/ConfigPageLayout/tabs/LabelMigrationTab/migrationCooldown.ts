import { formatDuration } from 'utils';

export const MIGRATION_COOLDOWN_MS = 2 * 60 * 60 * 1000;

type MigrationCooldown = { isCoolingDown: false } | { isCoolingDown: true; message: string };

// tenant.modified is bumped by the label-mode transition itself, so it doubles
// as "time of last transition" without needing a dedicated timestamp.
export function getMigrationCooldown(tenantModifiedSeconds: number | undefined, nowMs: number): MigrationCooldown {
  if (tenantModifiedSeconds === undefined) {
    return { isCoolingDown: false };
  }

  const remainingMs = MIGRATION_COOLDOWN_MS - (nowMs - tenantModifiedSeconds * 1000);

  if (remainingMs <= 0) {
    return { isCoolingDown: false };
  }

  return { isCoolingDown: true, message: `You can change your label mode in ${formatDuration(remainingMs)}` };
}
