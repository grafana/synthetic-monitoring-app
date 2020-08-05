import React, { FC, useState, useEffect } from 'react';
import { css } from 'emotion';
import { Field, HorizontalGroup, Input, IconButton, Label } from '@grafana/ui';

interface Props {
  queryParams: string;
  className: string;
}

interface QueryParam {
  name: string;
  value: string;
}

const QueryParams: FC<Props> = ({ queryParams, className }) => {
  const [formattedParams, updateFormattedParams] = useState([] as QueryParam[]);
  useEffect(() => {
    const params = new URLSearchParams(queryParams);
    const formatted: QueryParam[] = [];
    params.forEach((value, name) => {
      formatted.push({
        name,
        value,
      });
    });
    updateFormattedParams(formatted);
  }, [queryParams]);

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
          {formattedParams.map(({ name, value }) => (
            <>
              <Input label="Key" type="text" placeholder="Key" value={name} />
              <Input label="Value" type="text" placeholder="Value" value={value} />
              <IconButton name="minus-circle" />
            </>
          ))}
        </div>
      </Field>
    </div>
  );
};

export default QueryParams;
