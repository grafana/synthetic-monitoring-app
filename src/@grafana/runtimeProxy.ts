// [@ckbedwell] hackathon todo
// if someone wants to write instructions for symlinking this instead of
// copy and pasting our type declarations from
// https://github.com/grafana/grafana/blob/hackathon/i18n-all-the-things/packages/grafana-runtime/src/services/internationalization/i18n.tsx
// into this that would be great

// this file is a proxy for what we will be adding to the runtime
// our browsers will use what we write in grafana/grafana
// but out IDEs will use the typings from this file

import { ReactNode } from 'react';

import '@grafana/runtime';

declare module '@grafana/runtime' {
  type I18n = {
    SuccessfullySynced: () => string;
    Trans: (props: { children: ReactNode; i18nKey: string; ns?: string }) => any;
    t: (id: string, defaultMessage: string, values?: Record<string, unknown>) => string;
    PluginI18nProvider: (props: { children: ReactNode; namespace: string }) => any;
  };

  export const i18n: I18n;
}
