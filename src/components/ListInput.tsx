import React, { FC, useReducer, useEffect } from 'react';
import { HorizontalGroup, Field, Input, List, IconButton } from '@grafana/ui';

interface Action {
  type: string;
  index?: number;
  value?: string;
}

function listInputReducer(state: string[], action: Action): string[] {
  switch (action.type) {
    case 'delete': {
      return state.reduce((newState, item, index) => {
        if (index !== action.index) {
          newState.push(item);
        }
        return newState;
      }, [] as string[]);
    }
    case 'add': {
      return [...state, ''];
    }
    case 'change': {
      return state.map((value, index) => {
        if (index === action.index && action.value != null) {
          return action.value;
        }
        return value;
      });
    }
    default:
      return state;
  }
}

interface Props {
  description: string;
  label: string;
  items: string[];
  disabled?: boolean;
  dataTestId?: string;
  onUpdate: (items: string[]) => void;
}

const ListInput: FC<Props> = ({ label, description, items, disabled, onUpdate, dataTestId }) => {
  const [state, dispatch] = useReducer(listInputReducer, items);

  useEffect(() => {
    onUpdate(state);
  }, [state]);

  return (
    <div data-testid={dataTestId}>
      <Field label={label} description={description} disabled={disabled}>
        <>
          <List
            items={state}
            renderItem={(item, index) => (
              <HorizontalGroup>
                <Input
                  type="text"
                  placeholder="regexp"
                  value={item}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    dispatch({ type: 'change', index, value: event.target.value })
                  }
                  disabled={disabled}
                />
                <IconButton
                  name="minus-circle"
                  onClick={() => dispatch({ type: 'delete', index })}
                  disabled={disabled}
                />
              </HorizontalGroup>
            )}
          />
          <IconButton name="plus-circle" onClick={() => dispatch({ type: 'add' })} disabled={disabled} />
        </>
      </Field>
    </div>
  );
};

export default ListInput;
