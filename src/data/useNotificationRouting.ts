import { useQuery } from '@tanstack/react-query';
import { type Receiver, type RoutingTree } from '@grafana/api-clients/rtkq/notifications.alerting/v1beta1';
import { config, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

interface ResourceList<T> {
  items: T[];
  metadata?: { continue?: string };
}

export async function notificationRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: unknown
): Promise<T> {
  const { data } = await firstValueFrom(
    getBackendSrv().fetch<T>({
      url: `/apis/notifications.alerting.grafana.app/v1beta1/namespaces/${config.namespace}/${path}`,
      method,
      data: body,
      showErrorAlert: false,
    })
  );
  return data;
}

async function listResources<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let continuation: string | undefined;
  do {
    const { data } = await firstValueFrom(
      getBackendSrv().fetch<ResourceList<T>>({
        url,
        method: 'GET',
        params: continuation ? { continue: continuation } : undefined,
        showErrorAlert: false,
      })
    );
    items.push(...data.items);
    continuation = data.metadata?.continue;
  } while (continuation);
  return items;
}

export async function fetchNotificationRouting() {
  const base = `/apis/notifications.alerting.grafana.app/v1beta1/namespaces/${config.namespace}`;
  const [trees, contactPoints] = await Promise.all([
    listResources<RoutingTree>(`${base}/routingtrees`),
    listResources<Receiver>(`${base}/receivers`),
  ]);
  return { trees, contactPoints };
}

export const notificationRoutingQueryKey = () => ['notificationRouting', config.namespace];

// Use the app's query client so the summary and detailed previews share reads.
// A failed read must remain unknown, including after an earlier successful read.
export function useNotificationRouting() {
  return useQuery({
    queryKey: notificationRoutingQueryKey(),
    queryFn: fetchNotificationRouting,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: 'always',
    // The form starts this read before the alerting step mounts. Reuse that
    // result across its cards. Saving always checks current routing separately.
    staleTime: 30_000,
  });
}
