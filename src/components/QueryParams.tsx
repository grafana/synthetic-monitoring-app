import React, { useEffect, useReducer, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Label, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { HttpCheckCacheBuster } from './CheckEditor/FormComponents/HttpCheckCacheBuster';
import { QueryParam, QueryParamInput } from './QueryParamInput';

interface Props {
  target: URL;
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

export const QueryParams = ({ target, onChange, onBlur }: Props) => {
  const styles = useStyles2(getStyles);
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
    <Stack direction={`column`} gap={2}>
      <div className={styles.grid}>
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
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => dispatch({ type: 'add' })}>
          Add query param
        </Button>
      </div>
      <HttpCheckCacheBuster />
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    grid-gap: ${theme.spacing(1, 2)};
    align-items: center;
  `,
});
