import { type Probe } from 'types';
import { canEditProbes } from 'utils';

export function getTitle(probe?: Probe) {
  const verb = canEditProbes(probe) ? 'Editing' : 'Viewing';
  const type = !probe ? `` : probe.public ? 'public' : 'private';

  return `${verb} ${type} probe ${probe ? probe.name : ``}`;
}

type ErrorInfo = Error | null;

export function getErrorInfo(updateError: ErrorInfo, deleteError: ErrorInfo) {
  if (updateError) {
    return {
      title: 'Failed to update probe',
      message: updateError.message,
    };
  }

  if (deleteError) {
    const message = deleteError.message.includes('delete not allowed')
      ? 'You may have checks that are still using this probe.'
      : deleteError.message;

    return {
      title: 'Failed to delete probe',
      message,
    };
  }

  return undefined;
}
