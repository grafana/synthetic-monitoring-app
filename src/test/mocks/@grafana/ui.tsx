import React, { forwardRef } from 'react';

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');

  const Icon = forwardRef((props, ref) => <svg {...props} />);
  Icon.displayName = 'Icon';

  // Monaco does not render with jest and is stuck at "Loading..."
  // There doesn't seem to be a solution to this at this point,
  // mocking it instead. Related github issue:
  // https://github.com/suren-atoyan/monaco-react/issues/88
  const CodeEditor = React.forwardRef((props: any, ref: any) => {
    return <textarea ref={ref} data-testid="code-editor" onChange={props.onChange} value={props.value} />;
  });
  CodeEditor.displayName = 'CodeEditor';

  const Combobox = jest.fn(({ id, placeholder, options, value, onChange, disabled, name, onBlur, onFocus, ...props }) => {
    return (
      <select 
        id={id} 
        data-testid={id} 
        title={placeholder}
        value={value || ''}
        disabled={disabled}
        name={name}
        onChange={(e) => {
          if (onChange) {
            // Call onChange with the new value (matching real Combobox behavior)
            onChange(e.target.value);
          }
        }}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        {options?.map((option: any, index: number) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  });

  return {
    ...actual,
    Icon,
    BigValue: ({ value }: { value: { numeric: number; text?: string; title?: string } }) => (
      <div>
        {/* {value.numeric} */}
        {value.text && <span>{value.text}</span>}
        {value.title && <label>{value.title}</label>}
      </div>
    ),
    CodeEditor,
    measureText: jest.fn(() => ({ width: 100, height: 14 })),
    Combobox,
  };
});
