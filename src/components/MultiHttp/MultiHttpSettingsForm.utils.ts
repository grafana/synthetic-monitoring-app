import { useReducer } from 'react';
import { FieldErrors } from 'react-hook-form';

import { CheckFormValuesMultiHttp } from 'types';

type FormErrors = FieldErrors<CheckFormValuesMultiHttp>;

type RequestPanelState = {
  open: boolean;
};

type AddAction = {
  type: `addNewRequest`;
};

type UpdateAction = {
  type: `updateRequestPanel`;
  index: number;
  open: boolean;
};

type OpenMultipleAction = {
  type: `openRequestPanels`;
  indexes: number[];
};

type RemoveAction = {
  type: `removeRequest`;
  index: number;
};

type ToggleAction = {
  type: `toggle`;
  index: number;
};

type Action = UpdateAction | AddAction | OpenMultipleAction | RemoveAction | ToggleAction;

function reducer(state: RequestPanelState[], action: Action) {
  switch (action.type) {
    case 'addNewRequest':
      const newState = state.map((value) => {
        return {
          ...value,
          open: value.open,
        };
      });
      return [
        ...newState,
        {
          open: true,
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
          };
        }
        return value;
      });
    }
    case 'openRequestPanels': {
      return state.map((value, index) => {
        if (action.indexes.includes(index)) {
          return {
            ...value,
            open: true,
          };
        }

        return value;
      });
    }
    default:
      return state;
  }
}

export function useMultiHttpCollapseState(check: CheckFormValuesMultiHttp) {
  const initialState = check.settings.multihttp.entries?.map((_, index, arr) => ({
    open: index === arr.length - 1,
  })) ?? [{ open: true }];

  return useReducer(reducer, initialState);
}

export function getMultiHttpFormErrors(errs: FormErrors) {
  const entries = errs.settings?.multihttp?.entries;

  if (Array.isArray(entries) && entries.length > 0) {
    return entries.map((_, index) => index).filter((entry) => entry !== undefined);
  }

  return null;
}
