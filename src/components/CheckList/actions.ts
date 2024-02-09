import { CHECK_LIST_ICON_OVERLAY_LS_KEY, CHECK_LIST_VIEW_TYPE_LS_KEY } from 'components/constants';

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
