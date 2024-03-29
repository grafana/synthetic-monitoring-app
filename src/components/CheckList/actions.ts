import { CHECK_LIST_VIEW_TYPE_LS_KEY } from 'components/constants';

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
