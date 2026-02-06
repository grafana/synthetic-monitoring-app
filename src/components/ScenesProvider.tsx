import React, { type ReactNode, useEffect, useState } from 'react';
import { initPluginTranslations } from '@grafana/i18n';
import { Spinner } from '@grafana/ui';
import pluginJson from 'plugin.json';

// Initialize i18n (workaround for scenes#1322)
const i18nPromise = initPluginTranslations(pluginJson.id);
let i18nReady = false;
i18nPromise.then(() => {
  i18nReady = true;
});

export function ScenesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(i18nReady);

  useEffect(() => {
    i18nPromise.then(() => setReady(true));
  }, []);

  if (!ready) {
    return <Spinner />;
  }

  return children;
}
