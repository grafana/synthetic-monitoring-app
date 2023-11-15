export function getTitle(isNew: boolean, isPublic: boolean, name: string) {
  if (isNew) {
    return `New Probe`;
  }

  // mimic the parent page title whilst waiting for probe data.
  // otherwise the page title flashes twice when it receives data on a fresh load.
  if (!name) {
    return 'Probes';
  }

  if (isPublic) {
    return `Viewing ${name}`;
  }

  return `Editing ${name}`;
}

type ErrorInfo = Error | undefined;

export function getErrorInfo(createError: ErrorInfo, updateError: ErrorInfo, deleteError: ErrorInfo) {
  if (createError) {
    return {
      title: 'Failed to create probe',
      message: createError.message,
    };
  }

  if (updateError) {
    return {
      title: 'Failed to update probe',
      message: updateError.message,
    };
  }

  if (deleteError) {
    return {
      title: 'Failed to delete probe',
      message: deleteError.message,
    };
  }

  return undefined;
}
