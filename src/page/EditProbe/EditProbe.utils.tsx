import { type Probe } from 'types';
import { canEditProbes } from 'utils';

export function getTitle(probe?: Probe) {
  if (!probe) {
    return ``;
  }

  const verb = canEditProbes(probe) ? 'Editing' : 'Viewing';
  const type = probe.public ? 'public' : 'private';

  return `${verb} ${type} probe ${probe.name}`;
}

type ErrorInfo = Error | undefined;

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
