import React, { useEffect, useReducer, useState } from 'react';
import { Button, Field, Label } from '@grafana/ui';
import { css } from '@emotion/css';

import { QueryParam,QueryParamInput } from './QueryParamInput';

interface Props {
  target: URL;
  className?: string;
  onChange: (target: string) => void;
  onBlur?: () => void;
}

interface Action {
  type: string;
  index?: number;
  queryParam?: QueryParam;
  target?: URL;
}

function init(target: URL) {
  const params = target.search;
  const formatted = params
    .replace('?', '')
    .split('&')
    .map((queryParam) => {
      const [name, value = ''] = queryParam.split('=');
      return { name, value };
    });
  return formatted;
}

const getQueryParamString = (queryParams: QueryParam[]) => {
  return queryParams.reduce((paramString, param, index) => {
    return `${paramString}${index !== 0 ? '&' : ''}${param.name ?? ''}=${param.value ?? ''}`;
  }, '');
};

function queryParamReducer(state: QueryParam[], action: Action) {
  switch (action.type) {
    case 'change':
      return state.map((queryParam, index) => {
        if (index === action.index && action.queryParam) {
          return action.queryParam;
        }
        return queryParam;
      });
    case 'add':
      return [...state, { name: '', value: '' }];
    case 'delete':
      if (action.index == null) {
        return state;
      }
      return [...state.slice(0, action.index), ...state.slice(action.index + 1)];
    case 'sync':
      return init(action.target ?? new URL(''));
    default:
      return state;
  }
}

export const QueryParams = ({ target, onChange, className, onBlur }: Props) => {
  const [formattedParams, dispatch] = useReducer(queryParamReducer, target, init);
  const [shouldUpdate, setShouldUpdate] = useState(false);

  useEffect(() => {
    if (shouldUpdate) {
      const queryParamString = getQueryParamString(formattedParams);
      target.search = queryParamString;
      onChange(target.toString());
      setShouldUpdate(false);
    }
    // eslint-disable-next-line
  }, [shouldUpdate]);

  useEffect(() => {
    const queryParamString = getQueryParamString(formattedParams);
    if (target.search !== `?${queryParamString}`) {
      dispatch({ type: 'sync', target });
    }
    // eslint-disable-next-line
  }, [target]);

  const handleDelete = (index: number) => () => {
    dispatch({ type: 'delete', index });
    setShouldUpdate(true);
  };

  return (
    <div className={className}>
      <Field label="Query params" description="Query params for the target URL">
        <div
          className={css`
            display: grid;
            grid-template-columns: auto auto auto;
            grid-gap: 0.25rem;
            align-items: center;
          `}
        >
          <Label>Key</Label>
          <Label>Value</Label>
          <div />
          {formattedParams.map((queryParam, index) => (
            <QueryParamInput
              index={index}
              queryParam={queryParam}
              onBlur={onBlur}
              key={index}
              onDelete={handleDelete(index)}
              onChange={(updatedParam) => {
                dispatch({ type: 'change', queryParam: updatedParam, index: index });
                setShouldUpdate(true);
              }}
            />
          ))}
        </div>
      </Field>
      <Button type="button" variant="secondary" size="sm" onClick={() => dispatch({ type: 'add' })}>
        Add query param
      </Button>
    </div>
  );
};
