import React, { ChangeEvent } from 'react';
import { Input, IconButton } from '@grafana/ui';

export interface QueryParam {
  name: string;
  value: string;
}

interface Props {
  queryParam: {
    name: string;
    value: string;
  };
  onChange: (queryParam: QueryParam) => void;
  onDelete: () => void;
  onBlur?: () => void;
}

const QueryParamInput = ({ queryParam, onChange, onDelete, onBlur }: Props) => (
  <>
    <Input
      label="Key"
      onBlur={onBlur}
      type="text"
      placeholder="Key"
      value={queryParam.name}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        onChange({
          ...queryParam,
          name: e.target.value,
        })
      }
    />
    <Input
      label="Value"
      onBlur={onBlur}
      type="text"
      placeholder="Value"
      value={queryParam.value}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        onChange({
          ...queryParam,
          value: e.target.value,
        })
      }
    />
    <IconButton name="minus-circle" onClick={onDelete} type="button" tooltip="Delete" />
  </>
);

export default QueryParamInput;
