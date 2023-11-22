import { AppEvents } from '@grafana/data';
import appEvents from 'grafana/app/core/app_events';

const severityMapping = {
  success: AppEvents.alertSuccess,
  warning: AppEvents.alertWarning,
  error: AppEvents.alertError,
};

export const showAlert = (severity: keyof typeof severityMapping = 'success', message: string) => {
  appEvents.emit(severityMapping[severity], [message]);
};
