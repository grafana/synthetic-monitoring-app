import React, { FC, ChangeEvent } from 'react';
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
}

const QueryParamInput: FC<Props> = ({ queryParam, onChange, onDelete }) => (
  <>
    <Input
      label="Key"
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
    <IconButton name="minus-circle" onClick={onDelete} type="button" />
  </>
);

export default QueryParamInput;
