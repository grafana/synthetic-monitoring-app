// @ts-ignore
window.__react_router_build__ = undefined;

const ui = jest.requireActual('@grafana/ui');
import React, { forwardRef } from 'react';

const Select = forwardRef(
  ({ options, value, onChange, multiple = false, prefix, id, disabled, ...rest }: any, ref: any) => {
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
  }
);

Select.displayName = 'Select';

const MultiSelect = forwardRef((props, ref) => <Select {...props} ref={ref} multiple={true} />);

MultiSelect.displayName = 'MultiSelect';

// Using this specifically for Probe filter at the moment
const mockProbeOptions = [{ label: 'Chicago', value: 22 }];
const AsyncMultiSelect = forwardRef((props, ref) => (
  <Select {...props} options={mockProbeOptions} ref={ref} multiple={true} />
));

AsyncMultiSelect.displayName = 'AsyncMultiSelect';

const Icon = (props) => <svg {...props} />;

interface BigValueProps {
  value: {
    numeric: number;
    text?: string;
    title?: string;
  };
}

export function BigValue({ value }: BigValueProps) {
  return (
    <div>
      {/* {value.numeric} */}
      {value.text && <span>{value.text}</span>}
      {value.title && <label>{value.title}</label>}
    </div>
  );
}

module.exports = {
  ...ui,
  MultiSelect,
  Select,
  Icon,
  AsyncMultiSelect,
  BigValue,
};
