// @ts-nocheck
// Need to import all type declarations by one, monaco ignores import inside declaration files
import k6Browser from '!raw-loader!@types/k6/browser.d.ts';
import k6Crypto from '!raw-loader!@types/k6/crypto.d.ts';
import k6Data from '!raw-loader!@types/k6/data.d.ts';
import k6Encoding from '!raw-loader!@types/k6/encoding.d.ts';
import k6Exec from '!raw-loader!@types/k6/execution.d.ts';
import k6BrowserDeprecated from '!raw-loader!@types/k6/experimental/browser.d.ts';
import k6ExperimentalTracing from '!raw-loader!@types/k6/experimental/tracing.d.ts';
import k6Html from '!raw-loader!@types/k6/html.d.ts';
import k6Http from '!raw-loader!@types/k6/http.d.ts';
import k6Types from '!raw-loader!@types/k6/index.d.ts';
import k6Metrics from '!raw-loader!@types/k6/metrics.d.ts';
import k6Options from '!raw-loader!@types/k6/options.d.ts';
import k6Ws from '!raw-loader!@types/k6/ws.d.ts';

export { default as k6GlobalTypes } from '!raw-loader!@types/k6/global.d.ts';

// eslint-disable-next-line no-restricted-syntax
export default {
  k6: k6Types,
  'k6/browser': k6Browser,
  'k6/crypto': k6Crypto,
  'k6/data': k6Data,
  'k6/encoding': k6Encoding,
  'k6/execution': k6Exec,
  'k6/experimental/browser': k6BrowserDeprecated,
  'k6/experimental/tracing': k6ExperimentalTracing,
  'k6/html': k6Html,
  'k6/http': k6Http,
  'k6/metrics': k6Metrics,
  'k6/options': k6Options,
  'k6/ws': k6Ws,
};
