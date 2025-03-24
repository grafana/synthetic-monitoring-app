/* eslint-disable simple-import-sort/imports */
// Need to import all type declarations by one, monaco ignores import inside declaration files

// imports and object same order as defined in @types/k6/package.json

// @ts-expect-error
import k6 from '!raw-loader!@types/k6';
// @ts-expect-error
import k6Options from '!raw-loader!@types/k6/options';
// @ts-expect-error
import k6Ws from '!raw-loader!@types/k6/ws';
// @ts-expect-error
import k6Http from '!raw-loader!@types/k6/http';
// @ts-expect-error
import k6NetgRPC from '!raw-loader!@types/k6/net/grpc';
// @ts-expect-error
import k6Html from '!raw-loader!@types/k6/html';
// @ts-expect-error
import k6Metrics from '!raw-loader!@types/k6/metrics';
// @ts-expect-error
import k6Timers from '!raw-loader!@types/k6/timers';
// @ts-expect-error
import k6Execution from '!raw-loader!@types/k6/execution';
// @ts-expect-error
import k6Encoding from '!raw-loader!@types/k6/encoding';
// @ts-expect-error
import k6Data from '!raw-loader!@types/k6/data';
// @ts-expect-error
import k6Crypto from '!raw-loader!@types/k6/crypto';
// @ts-expect-error
import k6Browser from '!raw-loader!@types/k6/browser';
// @ts-expect-error
import k6ExperimentalCSV from '!raw-loader!@types/k6/experimental/csv';
// @ts-expect-error
import k6ExperimentalFS from '!raw-loader!@types/k6/experimental/fs';
// @ts-expect-error
import k6ExperimentalRedis from '!raw-loader!@types/k6/experimental/redis';
// @ts-expect-error
import k6ExperimentalWebcrypto from '!raw-loader!@types/k6/experimental/webcrypto';
// @ts-expect-error
import k6ExperimentalStreams from '!raw-loader!@types/k6/experimental/streams';
// @ts-expect-error
import k6ExperimentalWebsockets from '!raw-loader!@types/k6/experimental/websockets';

// eslint-disable-next-line no-restricted-syntax
export default {
  k6,
  'k6/options': k6Options,
  'k6/ws': k6Ws,
  'k6/http': k6Http,
  'k6/net/grpc': k6NetgRPC,
  'k6/html': k6Html,
  'k6/metrics': k6Metrics,
  'k6/timers': k6Timers,
  'k6/execution': k6Execution,
  'k6/encoding': k6Encoding,
  'k6/data': k6Data,
  'k6/crypto': k6Crypto,
  'k6/browser': k6Browser,
  'k6/experimental/csv': k6ExperimentalCSV,
  'k6/experimental/fs': k6ExperimentalFS,
  'k6/experimental/redis': k6ExperimentalRedis,
  'k6/experimental/webcrypto': k6ExperimentalWebcrypto,
  'k6/experimental/streams': k6ExperimentalStreams,
  'k6/experimental/websockets': k6ExperimentalWebsockets,
};
