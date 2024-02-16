import React from 'react';
import { within } from '@testing-library/react';
import { BASIC_CHECK_LIST, BASIC_SCRIPTED_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';

import { AlertSensitivity, ROUTES } from 'types';

import { submitForm } from './CheckEditor/testHelpers';
import { PLUGIN_URL_PATH } from './constants';
import { ScriptedCheckCodeEditor } from './ScriptedCheckCodeEditor';

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
    const { findByText } = render(<ScriptedCheckCodeEditor checks={[]} onSubmitSuccess={onReturn} />);
    expect(await findByText('Add a scripted check')).toBeInTheDocument();
  });

  it('creates a new k6 check', async () => {
    const { instance, user, findByLabelText, getByText, findByTestId, findByRole, findByPlaceholderText } = render(
      <ScriptedCheckCodeEditor checks={[]} onSubmitSuccess={onReturn} />
    );

    const JOB_NAME = 'New k6 check';
    const TARGET = 'https://www.k6.com';
    const LABEL = { name: 'k6labelname', value: 'k6labelvalue' };
    const SCRIPT = 'console.log("hello world")';

    const jobNameInput = await findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, JOB_NAME);
    const targetInput = await findByLabelText('Instance', { exact: false });
    await user.type(targetInput, TARGET);

    // Set probe options
    const probeOptions = getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    const probeSelectMenu = await within(probeOptions).findByTestId('select');
    await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText(PRIVATE_PROBE.name));

    const addLabel = await findByRole('button', { name: 'Add label' });
    await user.click(addLabel);
    const labelNameInput = await findByPlaceholderText('name');
    await user.type(labelNameInput, LABEL.name);
    const labelValueInput = await findByPlaceholderText('value');
    await user.type(labelValueInput, LABEL.value);

    const codeEditor = await findByTestId('code-editor');
    codeEditor.focus();
    await user.clear(codeEditor);
    await user.type(codeEditor, SCRIPT);
    await submitForm(onReturn, user);

    expect(instance.api?.addCheck).toHaveBeenCalledWith({
      job: JOB_NAME,
      target: TARGET,
      probes: [PRIVATE_PROBE.id],
      labels: [LABEL],
      settings: {
        k6: {
          script: btoa(SCRIPT),
        },
      },
      alertSensitivity: AlertSensitivity.None,
      basicMetricsOnly: true,
      enabled: true,
      frequency: 60000,
      timeout: 10000,
    });
  });
});

describe('edit scripted check', () => {
  it('populates correct values in form', async () => {
    const { instance, user, findByLabelText, findByTestId, findByPlaceholderText, findByText } = render(
      <ScriptedCheckCodeEditor checks={BASIC_CHECK_LIST} onSubmitSuccess={onReturn} />,
      {
        route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`,
        path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${BASIC_SCRIPTED_CHECK.id}`,
      }
    );
    const jobNameInput = await findByLabelText('Job name', { exact: false });
    expect(jobNameInput).toHaveValue(BASIC_SCRIPTED_CHECK.job);
    const targetInput = await findByLabelText('Instance', { exact: false });
    expect(targetInput).toHaveValue(BASIC_SCRIPTED_CHECK.target);

    expect(await findByText(PRIVATE_PROBE.name)).toBeInTheDocument();
    const labelNameInput = await findByPlaceholderText('name');
    expect(labelNameInput).toHaveValue(BASIC_SCRIPTED_CHECK.labels[0].name);
    const labelValueInput = await findByPlaceholderText('value');
    expect(labelValueInput).toHaveValue(BASIC_SCRIPTED_CHECK.labels[0].value);
    const codeEditor = await findByTestId('code-editor');
    expect(codeEditor).toHaveValue(atob(BASIC_SCRIPTED_CHECK.settings.scripted?.script!));
    await submitForm(onReturn, user);

    expect(instance.api?.updateCheck).toHaveBeenCalledWith(BASIC_SCRIPTED_CHECK);
  });

  it('handles editing correctly', async () => {
    const NEW_JOB_NAME = 'different job name';
    const NEW_TARGET_URL = 'https://www.example.com';
    const NEW_LABEL = { name: 'adifferentlabelname', value: 'adifferentlabelValue' };
    const NEW_SCRIPT = 'console.log("goodnight moon")';
    const { instance, user, findByLabelText, findByTestId, findByPlaceholderText, getByText } = render(
      <ScriptedCheckCodeEditor checks={BASIC_CHECK_LIST} onSubmitSuccess={onReturn} />,
      {
        route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`,
        path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${BASIC_SCRIPTED_CHECK.id}`,
      }
    );
    const jobNameInput = await findByLabelText('Job name', { exact: false });
    await user.clear(jobNameInput);
    await user.type(jobNameInput, NEW_JOB_NAME);
    const targetInput = await findByLabelText('Instance', { exact: false });
    await user.clear(targetInput);
    await user.type(targetInput, NEW_TARGET_URL);
    // probes
    // Set probe options
    const probeOptions = getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    const probeSelectMenu = await within(probeOptions).findByTestId('select');
    await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText(PUBLIC_PROBE.name));
    const labelNameInput = await findByPlaceholderText('name');
    await user.clear(labelNameInput);
    await user.type(labelNameInput, NEW_LABEL.name);
    const labelValueInput = await findByPlaceholderText('value');
    await user.clear(labelValueInput);
    await user.type(labelValueInput, NEW_LABEL.value);
    const codeEditor = await findByTestId('code-editor');
    await user.clear(codeEditor);
    await user.type(codeEditor, NEW_SCRIPT);
    await submitForm(onReturn, user);

    expect(instance.api?.updateCheck).toHaveBeenCalledWith({
      ...BASIC_SCRIPTED_CHECK,
      job: NEW_JOB_NAME,
      target: NEW_TARGET_URL,
      probes: [PUBLIC_PROBE.id],
      labels: [NEW_LABEL],
      tenantId: undefined,
      settings: {
        k6: {
          script: btoa(NEW_SCRIPT),
        },
      },
    });
  });
});
