import React, { ChangeEvent } from 'react';
import { IconButton, Input } from '@grafana/ui';

export interface QueryParam {
  name: string;
  value: string;
}

interface Props {
  index: number;
  queryParam: {
    name: string;
    value: string;
  };
  onChange: (queryParam: QueryParam) => void;
  onDelete: () => void;
  onBlur?: () => void;
}

export const QueryParamInput = ({ index, queryParam, onChange, onDelete, onBlur }: Props) => (
  <>
    <Input
      aria-label={`Query param key ${index + 1}`}
      label="Key"
      onBlur={onBlur}
      type="text"
      placeholder="Key"
      value={queryParam.name}
      data-fs-element="Query param key input"
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        onChange({
          ...queryParam,
          name: e.target.value,
        })
      }
    />
    <Input
      aria-label={`Query param value ${index + 1}`}
      label="Value"
      onBlur={onBlur}
      type="text"
      placeholder="Value"
      value={queryParam.value}
      data-fs-element="Query param value input"
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        onChange({
          ...queryParam,
          value: e.target.value,
        })
      }
    />
    <IconButton
      aria-label={`Delete param ${index + 1}`}
      name="minus-circle"
      onClick={onDelete}
      type="button"
      tooltip="Delete"
      data-fs-element="Query param delete button"
    />
  </>
);
