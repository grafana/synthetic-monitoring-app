import { AppEvents } from '@grafana/data';
import appEvents from 'grafana/app/core/app_events';

import { Check, FilteredCheck, GrafanaInstances, SubmissionErrorWrapper } from 'types';
import { CHECK_LIST_ICON_OVERLAY_LS_KEY, CHECK_LIST_VIEW_TYPE_LS_KEY } from 'components/constants';

export const fetchProbeOptions = async (instance: GrafanaInstances) => {
  const probes = await instance.api?.listProbes();
  if (probes) {
    return probes.map((p) => {
      return { label: p.name, value: p.id };
    });
  } else {
    return [{ label: 'No probes available', value: 0 }];
  }
};

export const enableSelectedChecks = async (
  instance: GrafanaInstances,
  selectedChecks: Set<number>,
  getSelectedChecks: () => FilteredCheck[]
) => {
  const checkUpdates = getSelectedChecks()
    .filter((check) => check && !check.enabled)
    .map((check) => {
      if (!check) {
        return Promise.reject('Could not find check with specified id');
      }
      return instance.api?.updateCheck({
        ...check,
        enabled: true,
      });
    });

  const resolvedCheckUpdates = await Promise.allSettled(checkUpdates);
  const { successCount, errorCount } = resolvedCheckUpdates.reduce(
    (acc, { status }) => {
      if (status === 'fulfilled') {
        acc.successCount = acc.successCount + 1;
      }
      if (status === 'rejected') {
        acc.errorCount = acc.errorCount + 1;
      }
      return acc;
    },
    {
      successCount: 0,
      errorCount: 0,
    }
  );

  const notUpdatedCount = selectedChecks.size - resolvedCheckUpdates.length;

  if (successCount > 0) {
    appEvents.emit(AppEvents.alertSuccess, [`${successCount} check${successCount > 1 ? 's' : ''} enabled`]);
  }
  if (errorCount > 0) {
    appEvents.emit(AppEvents.alertError, [`${errorCount} check${errorCount > 1 ? 's' : ''} were not enabled`]);
  }
  if (notUpdatedCount > 0) {
    appEvents.emit(AppEvents.alertWarning, [
      `${notUpdatedCount} check${notUpdatedCount > 1 ? 's' : ''} were already enabled`,
    ]);
  }
};

export const disableSelectedChecks = async (
  instance: GrafanaInstances,
  selectedChecks: Set<number>,
  getSelectedChecks: () => FilteredCheck[]
) => {
  const checkUpdates = getSelectedChecks()
    .filter((check) => check && check.enabled)
    .map((check) => {
      if (!check) {
        return Promise.reject('Could not find check with specified id');
      }
      return instance.api?.updateCheck({
        ...check,
        enabled: false,
      });
    });

  const resolvedCheckUpdates = await Promise.allSettled(checkUpdates);
  const { successCount, errorCount } = resolvedCheckUpdates.reduce(
    (acc, { status }) => {
      if (status === 'fulfilled') {
        acc.successCount = acc.successCount + 1;
      }
      if (status === 'rejected') {
        acc.errorCount = acc.errorCount + 1;
      }
      return acc;
    },
    {
      successCount: 0,
      errorCount: 0,
    }
  );

  const notUpdatedCount = selectedChecks.size - resolvedCheckUpdates.length;

  if (successCount > 0) {
    appEvents.emit(AppEvents.alertSuccess, [`${successCount} check${successCount > 1 ? 's' : ''} disabled`]);
  }
  if (errorCount > 0) {
    appEvents.emit(AppEvents.alertError, [`${errorCount} check${errorCount > 1 ? 's' : ''} were not disabled`]);
  }
  if (notUpdatedCount > 0) {
    appEvents.emit(AppEvents.alertWarning, [
      `${notUpdatedCount} check${notUpdatedCount > 1 ? 's' : ''} were already disabled`,
    ]);
  }
};

export const deleteSelectedChecks = async (instance: GrafanaInstances, selectedChecks: Set<number>) => {
  const checkDeletions = Array.from(selectedChecks).map((checkId) => instance.api?.deleteCheck(checkId));

  const resolvedCheckUpdates = await Promise.allSettled(checkDeletions);
  const { successCount, errorCount } = resolvedCheckUpdates.reduce(
    (acc, { status }) => {
      if (status === 'fulfilled') {
        acc.successCount = acc.successCount + 1;
      }
      if (status === 'rejected') {
        acc.errorCount = acc.errorCount + 1;
      }
      return acc;
    },
    {
      successCount: 0,
      errorCount: 0,
    }
  );

  if (successCount > 0) {
    appEvents.emit(AppEvents.alertSuccess, [`${successCount} check${successCount > 1 ? 's' : ''} deleted`]);
  }
  if (errorCount > 0) {
    appEvents.emit(AppEvents.alertError, [`${errorCount} check${errorCount > 1 ? 's' : ''} were not deleted`]);
  }
};

export const deleteSingleCheck = async (instance: GrafanaInstances, check: Check, onUpdate: () => void) => {
  try {
    if (!check.id) {
      appEvents.emit(AppEvents.alertError, ['There was an error deleting the check']);
      return;
    }
    await instance.api?.deleteCheck(check.id);
    appEvents.emit(AppEvents.alertSuccess, ['Check deleted successfully']);
    onUpdate();
  } catch (e) {
    const err = e as SubmissionErrorWrapper;
    const errorMessage = err?.data?.err ?? '';
    appEvents.emit(AppEvents.alertError, [`Could not delete check. ${errorMessage}`]);
  }
};

export const getIconOverlayToggleFromLS = () => {
  const lsValue = window.localStorage.getItem(CHECK_LIST_ICON_OVERLAY_LS_KEY);

  if (!lsValue) {
    return false;
  }

  try {
    return Boolean(JSON.parse(lsValue));
  } catch {
    return false;
  }
};

export const getViewTypeFromLS = () => {
  const lsValue = window.localStorage.getItem(CHECK_LIST_VIEW_TYPE_LS_KEY);
  if (lsValue) {
    try {
      return parseInt(lsValue, 10);
    } catch {
      return undefined;
    }
  }
  return undefined;
};
