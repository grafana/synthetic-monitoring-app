import React from 'react';
import { within } from '@testing-library/react';
import { render } from 'test/render';

import { ROUTES } from 'types';

import { BASIC_CHECK_LIST, BASIC_K6_CHECK, EDITED_K6_CHECK } from './CheckEditor/testConstants';
import { submitForm } from './CheckEditor/testHelpers';
import { PLUGIN_URL_PATH } from './constants';
import { K6CheckCodeEditor } from './K6CheckCodeEditor';

// Monaco does not render with jest and is stuck at "Loading..."
// There doesn't seem to be a solution to this at this point,
// mocking it instead. Related github issue:
// https://github.com/suren-atoyan/monaco-react/issues/88
jest.mock('components/CodeEditor', () => {
  const FakeEditor = React.forwardRef((props: any, ref: any) => {
    return <textarea ref={ref} data-testid="code-editor" {...props} />;
  });
  FakeEditor.displayName = 'CodeEditor';

  return {
    CodeEditor: FakeEditor,
  };
});

beforeEach(() => jest.resetAllMocks());
const onReturn = jest.fn();

describe('new scripted check', () => {
  it('renders the new scripted check form', async () => {
    const { findByText } = render(<K6CheckCodeEditor checks={[]} onSubmitSuccess={onReturn} />);
    expect(await findByText('Add a scripted check')).toBeInTheDocument();
  });
  it('creates a new k6 check', async () => {
    const { instance, user, findByLabelText, getByText, findByTestId, findByRole, findByPlaceholderText } = render(
      <K6CheckCodeEditor checks={[]} onSubmitSuccess={onReturn} />
    );

    const jobNameInput = await findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, 'Job name');
    const targetInput = await findByLabelText('Instance', { exact: false });
    await user.type(targetInput, 'https://www.grafana.com');

    // Set probe options
    const probeOptions = getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    // Select burritos probe options
    const probeSelectMenu = await within(probeOptions).findByTestId('select');
    await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos'));

    const addLabel = await findByRole('button', { name: 'Add label' });
    await user.click(addLabel);
    const labelNameInput = await findByPlaceholderText('name');
    await user.type(labelNameInput, 'labelName');
    const labelValueInput = await findByPlaceholderText('value');
    await user.type(labelValueInput, 'labelValue');

    const codeEditor = await findByTestId('code-editor');
    codeEditor.focus();
    await user.clear(codeEditor);
    await user.type(codeEditor, 'console.log("hello world")');
    await submitForm(onReturn, user);
    expect(instance.api?.addCheck).toHaveBeenCalledWith(BASIC_K6_CHECK);
  });
});

describe('edit scripted check', () => {
  it('populates correct values in form', async () => {
    const { instance, user, findByLabelText, findByTestId, findByPlaceholderText, findByText } = render(
      <K6CheckCodeEditor checks={BASIC_CHECK_LIST} onSubmitSuccess={onReturn} />,
      {
        route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`,
        path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/7`,
      }
    );

    const jobNameInput = await findByLabelText('Job name', { exact: false });
    expect(jobNameInput).toHaveValue('Job name');
    const targetInput = await findByLabelText('Instance', { exact: false });
    expect(targetInput).toHaveValue('https://www.grafana.com');

    // probes
    expect(await findByText('burritos')).toBeInTheDocument();

    const labelNameInput = await findByPlaceholderText('name');
    expect(labelNameInput).toHaveValue('labelName');
    const labelValueInput = await findByPlaceholderText('value');
    expect(labelValueInput).toHaveValue('labelValue');

    const codeEditor = await findByTestId('code-editor');
    expect(codeEditor).toHaveValue('console.log("hello world")');
    await submitForm(onReturn, user);
    expect(instance.api?.updateCheck).toHaveBeenCalledWith({ ...BASIC_K6_CHECK, tenantId: undefined, id: 7 });
  });

  it('handles editing correctly', async () => {
    const { instance, user, findByLabelText, findByTestId, findByPlaceholderText, getByText } = render(
      <K6CheckCodeEditor checks={BASIC_CHECK_LIST} onSubmitSuccess={onReturn} />,
      {
        route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`,
        path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/7`,
      }
    );

    const jobNameInput = await findByLabelText('Job name', { exact: false });
    await user.clear(jobNameInput);
    await user.type(jobNameInput, 'different job name');
    const targetInput = await findByLabelText('Instance', { exact: false });
    await user.clear(targetInput);
    await user.type(targetInput, 'https://www.example.com');

    // probes
    // Set probe options
    const probeOptions = getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    // Select burritos probe options
    const probeSelectMenu = await within(probeOptions).findByTestId('select');
    await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('tacos'));

    const labelNameInput = await findByPlaceholderText('name');
    await user.clear(labelNameInput);
    await user.type(labelNameInput, 'adifferentlabelname');
    const labelValueInput = await findByPlaceholderText('value');
    await user.clear(labelValueInput);
    await user.type(labelValueInput, 'adifferentlabelValue');

    const codeEditor = await findByTestId('code-editor');
    await user.clear(codeEditor);
    await user.type(codeEditor, 'console.log("goodnight moon")');
    await submitForm(onReturn, user);
    expect(instance.api?.updateCheck).toHaveBeenCalledWith({ ...EDITED_K6_CHECK, tenantId: undefined, id: 7 });
  });
});
