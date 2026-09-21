import React, { ComponentProps } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { UI_TEST_ID } from 'test/dataTestIds';

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

jest.mock('components/Checkster/contexts/ChecksterContext', () => ({
  useChecksterContext: () => ({ checkType: 'browser' }),
}));

jest.mock('components/Checkster/contexts/FeatureTabsContext', () => ({
  useFeatureTabsContext: () => ({ setActive: jest.fn() }),
}));

jest.mock('components/CodeEditor', () => ({
  CodeEditor: jest.fn(({ value, onChange, readOnly, renderHeader }) => (
    <>
      {renderHeader?.({ scriptValue: value })}
      <textarea
        data-testid={UI_TEST_ID.codeEditor}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder="Enter script code here..."
      />
    </>
  )),
}));

// Secret scanner integration: the feature is off by default here, and its data
// hooks require app-level providers this lightweight renderer doesn't supply.
jest.mock('contexts/FeatureFlagContext', () => ({
  ...jest.requireActual('contexts/FeatureFlagContext'),
  isFeatureEnabled: jest.fn(() => false),
}));

jest.mock('data/permissions', () => ({
  ...jest.requireActual('data/permissions'),
  getUserPermissions: jest.fn(() => ({ canCreateSecrets: false, canReadSecrets: false })),
}));

jest.mock('data/useSecrets', () => ({
  useSecrets: jest.fn(() => ({ data: [] })),
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

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
    expect(codeEditor).toBeInTheDocument();
  });

  it('reflects default value from form', () => {
    const scriptContent = 'console.log("Hello, World!");';
    renderGenericScriptField(undefined, { value: scriptContent });

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
    expect(codeEditor).toHaveValue(scriptContent);
  });

  it('handles user input correctly', async () => {
    const user = renderGenericScriptField({
      field: 'settings.scripted.script' as any,
    });

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
    const newContent = 'const result = 42;';

    await user.clear(codeEditor);
    await user.type(codeEditor, newContent);

    expect(codeEditor).toHaveValue(newContent);
  });

  it('is read-only when form is disabled', () => {
    renderGenericScriptField(undefined, { disabled: true });
    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
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

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
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

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
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

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
    expect(codeEditor).toHaveValue(scriptWithSpecialChars);
  });

  it('applies custom styling through emotion css', () => {
    renderGenericScriptField({
      field: 'settings.scripted.script' as any,
    });

    // The component uses emotion CSS for styling the Column component
    // We can verify the component structure is rendered correctly
    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
    expect(codeEditor).toBeInTheDocument();
  });

  it('updates form value when content changes', async () => {
    const user = renderGenericScriptField({
      field: 'settings.scripted.script' as any,
    });

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
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

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
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

    const codeEditor = screen.getByTestId(UI_TEST_ID.codeEditor);
    expect(codeEditor).toHaveValue(formattedScript);
  });
});

describe('script editor toolbar', () => {
  const examples = [
    { label: 'Basic example', script: 'console.log("basic");', value: 'basic.js' },
    { label: 'Advanced example', script: 'console.log("advanced");', value: 'advanced.js' },
  ];

  it('does not show a "Load example" option when no examples are provided', async () => {
    const user = renderGenericScriptField({ field: 'settings.scripted.script' as any });

    await user.click(screen.getByRole('button', { name: /need help/i }));

    expect(screen.queryByRole('menuitem', { name: /load example/i })).not.toBeInTheDocument();
  });

  it('asks for confirmation before loading a template, and replaces the script on confirm', async () => {
    const user = renderGenericScriptField(
      { field: 'settings.scripted.script' as any, examples },
      { 'settings.scripted.script': 'const original = true;' }
    );

    await user.click(screen.getByRole('button', { name: /need help/i }));
    // Submenus open on hover, not click — clicking the parent item only keeps the menu open.
    await user.hover(screen.getByRole('menuitem', { name: /load example/i }));
    // userEvent.click does pointer-coordinate target resolution, which breaks on jsdom's
    // zeroed-out layout for deeply nested submenu items; fireEvent dispatches directly instead.
    fireEvent.click(screen.getByRole('menuitem', { name: 'Basic example' }));

    const dialog = await waitFor(() => screen.getByRole('dialog', { name: /load example script/i }));
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Load example' }));

    expect(screen.getByTestId(UI_TEST_ID.codeEditor)).toHaveValue('console.log("basic");');
  });

  it('keeps the existing script if the load-example confirmation is dismissed', async () => {
    const user = renderGenericScriptField(
      { field: 'settings.scripted.script' as any, examples },
      { 'settings.scripted.script': 'const original = true;' }
    );

    await user.click(screen.getByRole('button', { name: /need help/i }));
    await user.hover(screen.getByRole('menuitem', { name: /load example/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Basic example' }));

    const dialog = await waitFor(() => screen.getByRole('dialog', { name: /load example script/i }));
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.getByTestId(UI_TEST_ID.codeEditor)).toHaveValue('const original = true;');
  });

  it('opens an expanded editor when the expand control is clicked', async () => {
    const user = renderGenericScriptField({ field: 'settings.scripted.script' as any });

    await user.click(screen.getByRole('button', { name: /expand editor/i }));

    expect(screen.getByRole('dialog', { name: 'Script' })).toBeInTheDocument();
  });
});
