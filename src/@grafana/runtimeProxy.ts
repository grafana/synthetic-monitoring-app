// [@ckbedwell] hackathon todo
// if someone wants to write instructions for symlinking this instead of
// copy and pasting our type declarations from
// https://github.com/grafana/grafana/blob/hackathon/i18n-all-the-things/packages/grafana-runtime/src/services/i18n.ts
// into this that would be great

// this file is a proxy for what we will be adding to the runtime
// our browsers will use what we write in grafana/grafana
// but out IDEs will use the typings from this file

import * as runtime from '@grafana/runtime';

declare module '@grafana/runtime' {
  export const SuccessfullySynced: () => string;
}

export const SuccessfullySynced = runtime.SuccessfullySynced;
