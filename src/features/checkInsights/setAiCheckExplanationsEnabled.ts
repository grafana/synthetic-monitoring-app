import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { VerifiedMeta } from 'contexts/MetaContext';

// `meta` is read once at app mount (see MetaContextProvider) and isn't refetched, so a saved
// change only takes effect after a reload — same tradeoff PluginConfigPage.utils's enablePlugin
// makes for the same reason.
export async function setAiCheckExplanationsEnabled(meta: VerifiedMeta, aiCheckExplanationsEnabled: boolean) {
  await firstValueFrom(
    getBackendSrv().fetch({
      url: `/api/plugins/${meta.id}/settings`,
      method: 'POST',
      data: {
        enabled: meta.enabled,
        pinned: meta.pinned,
        jsonData: {
          ...meta.jsonData,
          aiCheckExplanationsEnabled,
        },
      },
    })
  );

  window.location.reload();
}
