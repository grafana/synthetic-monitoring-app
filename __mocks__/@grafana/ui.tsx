import * as ui from '@grafana/ui';
import React, { forwardRef } from 'react';

const Select = forwardRef(({ options, value, onChange, multiple = false, prefix, id, ...rest }: any, ref: any) => {
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
      <select
        id={id}
        ref={ref}
        data-testid={rest['data-testid'] ?? 'select'}
        value={value?.value ?? value}
        onChange={handleChange}
        multiple={multiple}
      >
        {options.map(({ label, value }, index) => (
          <option key={index} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
});

Select.displayName = 'Select';

const MultiSelect = forwardRef((props, ref) => <Select {...props} ref={ref} multiple={true} />);

MultiSelect.displayName = 'MultiSelect';

const Icon = (props) => <svg {...props} />;

module.exports = {
  ...ui,
  MultiSelect,
  Select,
  Icon,
};
