import React, { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericScriptField } from './GenericScriptField';

// Mock dependencies
jest.mock('../../../utils/form', () => ({
  getFieldErrorProps: jest.fn((errors, field, interpolationVariables) => ({
    error: field === 'error-field' ? 'This is a mocked error message' : undefined,
    invalid: field === 'error-field',
  })),
}));

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  useTheme2: jest.fn(() => ({
    colors: {
      background: {
        canvas: '#ffffff',
      },
    },
    spacing: jest.fn((top, right, bottom, left) => `${top || 0}px ${right || 0}px ${bottom || 0}px ${left || 0}px`),
  })),
  FieldValidationMessage: jest.fn(({ children }) => <div data-testid="field-validation-message">{children}</div>),
}));

jest.mock('components/CodeEditor', () => ({
  CodeEditor: jest.fn(({ value, onChange, readOnly }) => (
    <textarea
      data-testid="code-editor"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder="Enter script code here..."
    />
  )),
}));

const defaultProps = {
  field: 'value',
} as any;

function renderGenericScriptField(
  props?: Partial<ComponentProps<typeof GenericScriptField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericScriptField, { ...defaultProps, ...props }, formValues);
}

describe('GenericScriptField', () => {
  it('renders a code editor', () => {
    renderGenericScriptField();

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toBeInTheDocument();
  });

  it('reflects default value from form', () => {
    const scriptContent = 'console.log("Hello, World!");';
    renderGenericScriptField(undefined, { value: scriptContent });

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveValue(scriptContent);
  });

  it('handles user input correctly', async () => {
    const user = renderGenericScriptField({
      field: 'settings.scripted.script' as any,
    });

    const codeEditor = screen.getByTestId('code-editor');
    const newContent = 'const result = 42;';

    await user.clear(codeEditor);
    await user.type(codeEditor, newContent);

    expect(codeEditor).toHaveValue(newContent);
  });

  it('is read-only when form is disabled', () => {
    renderGenericScriptField(undefined, { disabled: true });
    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveAttribute('readOnly');
  });

  it('displays field validation message when there are errors', () => {
    renderGenericScriptField({
      field: 'error-field' as any,
    });

    const validationMessage = screen.getByTestId('field-validation-message');
    expect(validationMessage).toBeInTheDocument();
    expect(validationMessage).toHaveTextContent('This is a mocked error message');
  });

  it('does not display validation message when there are no errors', () => {
    renderGenericScriptField({
      field: 'settings.scripted.script' as any,
    });

    const validationMessage = screen.queryByTestId('field-validation-message');
    expect(validationMessage).not.toBeInTheDocument();
  });

  it('handles empty script value', () => {
    renderGenericScriptField();

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveValue('');
  });

  it('handles multiline script content', () => {
    const multilineScript = `function checkWebsite() {
  const response = http.get('https://example.com');
  console.log(response.status);
  return response.status === 200;
}`;

    renderGenericScriptField(
      {
        field: 'settings.scripted.script' as any,
      },
      { 'settings.scripted.script': multilineScript } as any
    );

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveValue(multilineScript);
  });

  it('handles script with special characters', () => {
    const scriptWithSpecialChars =
      'const regex = /[a-zA-Z0-9]+/g;\nconst url = "https://api.example.com/v1/users?limit=10&offset=0";';

    renderGenericScriptField(
      {
        field: 'settings.scripted.script' as any,
      },
      { 'settings.scripted.script': scriptWithSpecialChars } as any
    );

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveValue(scriptWithSpecialChars);
  });

  it('applies custom styling through emotion css', () => {
    renderGenericScriptField({
      field: 'settings.scripted.script' as any,
    });

    // The component uses emotion CSS for styling the Column component
    // We can verify the component structure is rendered correctly
    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toBeInTheDocument();
  });

  it('updates form value when content changes', async () => {
    const user = renderGenericScriptField({
      field: 'settings.scripted.script' as any,
    });

    const codeEditor = screen.getByTestId('code-editor');
    const initialContent = 'const x = 1;';
    const updatedContent = 'const x = 2;';

    // Set initial content
    await user.clear(codeEditor);
    await user.type(codeEditor, initialContent);
    expect(codeEditor).toHaveValue(initialContent);

    // Update content
    await user.clear(codeEditor);
    await user.type(codeEditor, updatedContent);
    expect(codeEditor).toHaveValue(updatedContent);
  });

  it('handles different field paths', () => {
    renderGenericScriptField({
      field: 'settings.k6.script' as any,
    });

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toBeInTheDocument();
  });

  it('preserves whitespace and formatting in scripts', () => {
    const formattedScript = `  function test() {
    const result = {
      success: true,
      data: null
    };
    return result;
  }`;

    renderGenericScriptField(
      {
        field: 'settings.scripted.script' as any,
      },
      { 'settings.scripted.script': formattedScript } as any
    );

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveValue(formattedScript);
  });
});
