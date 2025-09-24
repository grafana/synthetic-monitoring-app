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
  };
});
