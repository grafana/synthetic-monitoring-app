export const DASHBOARD_UPDATE_NOTIFICATION_KEY = 'hasDismissedDashboardUpdate';

export function hasDismissedDashboardUpdateModal() {
  return Boolean(window.sessionStorage.getItem(DASHBOARD_UPDATE_NOTIFICATION_KEY));
}

export function persistDashboardModalDismiss() {
  window.sessionStorage.setItem(DASHBOARD_UPDATE_NOTIFICATION_KEY, 'true');
}
