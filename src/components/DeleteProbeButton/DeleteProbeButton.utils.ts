import type { BackendError } from './DeleteProbeButton.types';
import { Probe } from 'types';

export function getPrettyError(error: Error | BackendError, probe: Probe) {
  if (!error) {
    return undefined;
  }

  if ('data' in error && 'err' in error.data && 'msg' in error.data && typeof error.data.msg === 'string') {
    return { name: error.data.err, message: error.data.msg.replace(String(probe.id), `'${probe.name}'`) };
  }

  return { name: 'Unknown error', message: 'An unknown error occurred' };
}
