import { type ProbeWithMetadata } from 'types';

export function getTitle(probe?: ProbeWithMetadata, canEdit?: boolean) {
  const verb = canEdit ? 'Editing' : 'Viewing';
  const type = !probe ? `` : probe.public ? 'public' : 'private';

  return `${verb} ${type} probe ${probe ? probe.displayName : ``}`;
}

type ErrorInfo = Error | null;

export function getErrorInfo(updateError: ErrorInfo) {
  if (updateError) {
    return {
      title: 'Failed to update probe',
      message: updateError.message,
    };
  }

  return undefined;
}
