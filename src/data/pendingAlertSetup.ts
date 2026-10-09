import { useCallback } from 'react';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { config } from '@grafana/runtime';
import { z } from 'zod';

import { CheckAlertType } from 'types';

const draftSchema = z.object({
  name: z.enum(CheckAlertType),
  threshold: z.number(),
  period: z.string().optional(),
  runbookUrl: z.string().optional(),
});
const pendingSchema = z.object({
  alerts: z.array(draftSchema),
  previousAlerts: z.array(draftSchema),
});
export type PendingAlertSetup = z.infer<typeof pendingSchema>;

const key = (checkId: number) => ['pendingAlertSetup', config.namespace, config.bootData.user.id, checkId];
const storageKey = (checkId: number) => JSON.stringify(key(checkId));

function readPendingAlertSetup(checkId: number): PendingAlertSetup | null {
  try {
    const parsed = pendingSchema.safeParse(JSON.parse(localStorage.getItem(storageKey(checkId)) ?? 'null'));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// The API persists accepted alert definitions and their creation status. This
// browser-local draft additionally lets the creator recover a failed PUT after
// navigation or reload. It is never treated as shared server state.
export function setPendingAlertSetup(client: QueryClient, checkId: number, pending: PendingAlertSetup | null) {
  try {
    if (pending) {
      localStorage.setItem(storageKey(checkId), JSON.stringify(pending));
    } else {
      localStorage.removeItem(storageKey(checkId));
    }
  } catch {
    // Recovery still works in the current page when browser storage is unavailable.
  }
  client.setQueryData(key(checkId), pending);
}

export function usePendingAlertSetup(checkId: number) {
  const client = useQueryClient();
  const { data = null } = useQuery({
    queryKey: key(checkId),
    queryFn: () => readPendingAlertSetup(checkId),
    initialData: () => readPendingAlertSetup(checkId),
    staleTime: Infinity,
  });
  const clear = useCallback(() => setPendingAlertSetup(client, checkId, null), [client, checkId]);
  return { pending: data, clear };
}
