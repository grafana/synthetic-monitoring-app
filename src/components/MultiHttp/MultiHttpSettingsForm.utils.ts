import { useReducer } from 'react';
import { DeepMap, FieldError } from 'react-hook-form';

import { Check, CheckFormValues } from 'types';

import { MultiHttpFormTabs } from './MultiHttpTypes';

const tabOrder = [
  MultiHttpFormTabs.Headers,
  MultiHttpFormTabs.QueryParams,
  MultiHttpFormTabs.Assertions,
  MultiHttpFormTabs.Variables,
  MultiHttpFormTabs.Body,
];

type FormErrors = DeepMap<CheckFormValues, FieldError>;

export const tabErrorMap = (errors: FormErrors, index: number, tab: MultiHttpFormTabs) => {
  const entry = errors?.settings?.multihttp?.entries?.[index];

  const tabErrorPathMap = {
    [MultiHttpFormTabs.Headers]: entry?.request?.headers?.length,
    [MultiHttpFormTabs.QueryParams]: entry?.request?.queryFields?.length,
    [MultiHttpFormTabs.Assertions]: entry?.checks?.length,
    [MultiHttpFormTabs.Variables]: entry?.variables?.length,
    [MultiHttpFormTabs.Body]: false, // Body tab does not have any validation
  };

  return tabErrorPathMap[tab];
};

type RequestPanelState = {
  open: boolean;
  activeTab: MultiHttpFormTabs;
};

type Action = {
  type: string;
  index?: number;
  open?: boolean;
  tab?: MultiHttpFormTabs;
};

function reducer(state: RequestPanelState[], action: Action) {
  switch (action.type) {
    case 'addNewRequest':
      const newState = state.map((value) => {
        return {
          ...value,
          open: false,
        };
      });
      return [
        ...newState,
        {
          open: true,
          activeTab: MultiHttpFormTabs.Headers,
        },
      ];
    case 'removeRequest':
      return state.filter((_, index) => index !== action.index);
    case 'toggle': {
      return state.map((value, index) => {
        if (action.index === index) {
          return {
            ...value,
            open: !value.open,
          };
        }
        return value;
      });
    }
    case 'updateRequestPanel': {
      return state.map((value, index) => {
        if (action.index === index) {
          return {
            ...value,
            open: action.open || value.open,
            activeTab: action.tab || value.activeTab,
          };
        }
        return value;
      });
    }
    default:
      return state;
  }
}

export function useMultiHttpCollapseState(check: Check) {
  const initialState = check.settings.multihttp?.entries?.map((_, index, arr) => ({
    open: index === arr.length - 1,
    activeTab: MultiHttpFormTabs.Headers,
  })) ?? [{ open: true, activeTab: MultiHttpFormTabs.Headers }];

  return useReducer(reducer, initialState);
}

export function getMultiHttpFormErrors(errs: FormErrors) {
  const errKeys = Object.keys(errs);
  const entries = errs.settings?.multihttp?.entries;
  const isMultiHttpError = errKeys.length === 1 && entries;

  if (isMultiHttpError) {
    const firstCollapsibleError = entries.findIndex(Boolean);
    const firstTabWithErrors = tabOrder
      .map((tab) => {
        if (tabErrorMap(errs, firstCollapsibleError, tab)) {
          return tab;
        }

        return false;
      })
      .filter(Boolean);

    return {
      id: `settings.multihttp.entries${findPath(entries, 'message')}`,
      index: firstCollapsibleError,
      tab: firstTabWithErrors[0] || MultiHttpFormTabs.Headers,
    };
  }

  return false;
}

// rudimentary tree traversal to find the first object with asked for key
function findPath(target: any, key: string, existingPath = ``): string | null {
  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      let path = findPath(target[i], key, `${existingPath}[${i}]`);

      if (path) {
        return path;
      }
    }
  }

  if (target !== null && typeof target === 'object') {
    if (target.hasOwnProperty(key)) {
      return existingPath;
    }

    for (let k in target) {
      let path = findPath(target[k], key, existingPath ? `${existingPath}.${k}` : k);

      if (path) {
        return path;
      }
    }
  }

  return null;
}

export function focusField(buttonRef: HTMLButtonElement | null, id: string) {
  requestAnimationFrame(() => {
    buttonRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    requestAnimationFrame(() => {
      const inputEl = document.querySelector(`[name="${id}"]`);

      if (inputEl instanceof HTMLInputElement) {
        if (inputEl.type === 'hidden') {
          const focussableInput = inputEl?.parentElement?.querySelector(`input`);
          return focussableInput?.focus({ preventScroll: true });
        }

        inputEl.focus({ preventScroll: true });
      }
    });
  });
}
