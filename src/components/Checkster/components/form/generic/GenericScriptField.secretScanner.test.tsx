import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor, within } from '@testing-library/react';
import { UI_TEST_ID } from 'test/dataTestIds';
import { render } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';

import { GenericScriptField } from './GenericScriptField';

jest.mock('components/Checkster/contexts/ChecksterContext', () => ({
  useChecksterContext: () => ({ checkType: 'scripted' }),
}));

jest.mock('components/Checkster/contexts/FeatureTabsContext', () => ({
  useFeatureTabsContext: () => ({ setActive: jest.fn() }),
}));

const SCRIPT_WITH_SECRET = `const password = 'he110-w0rlD'
export default function () {}`;
const SCRIPT_WITHOUT_SECRET = `import http from 'k6/http';
export default function () {
  http.get('https://example.com');
}`;

function ScriptFieldHarness({ script }: { script: string }) {
  const methods = useForm({
    defaultValues: {
      settings: {
        scripted: {
          script,
        },
      },
    },
  });

  return (
    <FormProvider {...methods}>
      <GenericScriptField field="settings.scripted.script" />
    </FormProvider>
  );
}

function renderScriptField(script: string) {
  return render(<ScriptFieldHarness script={script} />);
}

describe('GenericScriptField secret scanner', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('does not show the scanner panel when the secrets flag is off', async () => {
    renderScriptField(SCRIPT_WITH_SECRET);

    await screen.findByTestId(UI_TEST_ID.codeEditor);
    expect(screen.queryByText(/potential secret detected/i)).not.toBeInTheDocument();
  });

  it('does not show the scanner panel when the script has no secrets', async () => {
    mockFeatureToggles({ [FeatureName.SecretsManagement]: true });
    renderScriptField(SCRIPT_WITHOUT_SECRET);

    await screen.findByTestId(UI_TEST_ID.codeEditor);
    expect(screen.queryByText(/potential secret detected/i)).not.toBeInTheDocument();
  });

  it('shows detected secrets and lets the user ignore them', async () => {
    mockFeatureToggles({ [FeatureName.SecretsManagement]: true });
    const { user } = renderScriptField(SCRIPT_WITH_SECRET);

    expect(await screen.findByText(/potential secret detected/i)).toBeInTheDocument();
    expect(screen.getByText('NAMED SECRET')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ignore' }));

    expect(screen.queryByText(/potential secret detected/i)).not.toBeInTheDocument();
  });

  it('opens the create-secret modal prefilled and rewrites the script on save', async () => {
    mockFeatureToggles({ [FeatureName.SecretsManagement]: true });
    const { user } = renderScriptField(SCRIPT_WITH_SECRET);

    expect(await screen.findByText(/potential secret detected/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Move to secret' }));

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByLabelText(/Name/)).toHaveValue('named-secret');
    expect(within(modal).getByLabelText(/Description/)).toHaveValue('Migrated from script (NAMED SECRET)');
    expect(within(modal).getByLabelText(/Value/)).toHaveValue('he110-w0rlD');

    await user.click(within(modal).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect((screen.getByTestId(UI_TEST_ID.codeEditor) as HTMLTextAreaElement).value).toContain(
      `secrets.get('test-secret-1')`
    );
  });
});
