import * as ui from '@grafana/ui';
import React from 'react';

const Select = ({ options, value, onChange, multiple = false, prefix, ...rest }: any) => {
  function handleChange(event) {
    const option = options.find((option) => {
      return String(option.value) === event.currentTarget.value;
    });
    if (!multiple) {
      onChange(option);
    } else {
      onChange([option]);
    }
  }

  return (
    <div>
      {prefix}
      <select data-testid={rest['data-testid'] ?? 'select'} value={value} onChange={handleChange} multiple={multiple}>
        {options.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

const MultiSelect = (props) => <Select {...props} multiple={true} />;

module.exports = {
  ...ui,
  MultiSelect,
  Select,
};
