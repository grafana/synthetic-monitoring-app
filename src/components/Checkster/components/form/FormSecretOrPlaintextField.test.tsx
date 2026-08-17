import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCKED_SECRETS } from 'test/fixtures/secrets';
import { runTestAsSecretsNoAccess, runTestAsSecretsReadOnly, selectOption } from 'test/utils';

import { useSecrets } from 'data/useSecrets';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

import { formTestRenderer, TestFormTestId } from './__test__/formTestRenderer';
import { FormSecretOrPlaintextField } from './FormSecretOrPlaintextField';

jest.mock('data/useSecrets', () => ({ useSecrets: jest.fn() }));
jest.mock('hooks/useFeatureFlag', () => ({ useFeatureFlag: jest.fn() }));

const FIELD = 'settings.http.bearerToken';

function mockFlag(isEnabled: boolean) {
  (useFeatureFlag as jest.Mock).mockReturnValue({ isEnabled, isReady: true });
}

beforeEach(() => {
  (useSecrets as jest.Mock).mockReturnValue({ data: MOCKED_SECRETS, isLoading: false });
  mockFlag(true);
  runTestAsSecretsReadOnly();
});

it('shows the Value/Secret toggle when secrets are available', () => {
  formTestRenderer(FormSecretOrPlaintextField, { field: FIELD, label: 'Token', variant: 'password', allowSecrets: true });

  expect(screen.getByRole('radio', { name: 'Value' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Secret' })).toBeInTheDocument();
});

it('hides the toggle when allowSecrets is false', () => {
  formTestRenderer(FormSecretOrPlaintextField, {
    field: FIELD,
    label: 'Token',
    variant: 'password',
    allowSecrets: false,
  });

  expect(screen.queryByRole('radio', { name: 'Secret' })).not.toBeInTheDocument();
});

it('hides the toggle when the feature flag is off', () => {
  mockFlag(false);
  formTestRenderer(FormSecretOrPlaintextField, { field: FIELD, label: 'Token', variant: 'password', allowSecrets: true });

  expect(screen.queryByRole('radio', { name: 'Secret' })).not.toBeInTheDocument();
});

it('hides the toggle when the user cannot read secrets', () => {
  runTestAsSecretsNoAccess();
  formTestRenderer(FormSecretOrPlaintextField, { field: FIELD, label: 'Token', variant: 'password', allowSecrets: true });

  expect(screen.queryByRole('radio', { name: 'Secret' })).not.toBeInTheDocument();
});

it('writes a ${secrets.<name>} reference into the field when a secret is picked', async () => {
  const user = formTestRenderer(FormSecretOrPlaintextField, {
    field: FIELD,
    label: 'Token',
    variant: 'password',
    allowSecrets: true,
  });

  await user.click(screen.getByRole('radio', { name: 'Secret' }));
  // The option's accessible name includes its description, so match on a substring.
  await selectOption(user, { label: 'Token', option: /test-secret-1/ });

  expect(screen.getByTestId(TestFormTestId.Value)).toHaveTextContent('${secrets.test-secret-1}');
});

it('starts in secret mode when the field already holds a reference', () => {
  formTestRenderer(
    FormSecretOrPlaintextField,
    { field: FIELD, label: 'Token', variant: 'password', allowSecrets: true },
    { settings: { http: { bearerToken: '${secrets.test-secret-1}' } } }
  );

  expect(screen.getByRole('radio', { name: 'Secret' })).toBeChecked();
  expect(screen.getByDisplayValue('test-secret-1')).toBeInTheDocument();
});

it('switches to secret mode and keeps the reference when a ${secrets.<name>} value is entered in Value mode', async () => {
  const user = formTestRenderer(FormSecretOrPlaintextField, {
    field: FIELD,
    label: 'Token',
    variant: 'password',
    allowSecrets: true,
  });

  expect(screen.getByRole('radio', { name: 'Value' })).toBeChecked();

  const input = screen.getByLabelText('Token');
  await user.click(input);
  await user.paste('${secrets.test-secret-1}');

  // A reference must flip the control to secret mode instead of staying on a
  // masked value input, and it must not be dropped.
  expect(await screen.findByRole('radio', { name: 'Secret' })).toBeChecked();
  expect(screen.getByTestId(TestFormTestId.Value)).toHaveTextContent('${secrets.test-secret-1}');
});

it('clears a secret reference when switching to Value mode so it is not saved as plaintext', async () => {
  const user = formTestRenderer(
    FormSecretOrPlaintextField,
    { field: FIELD, label: 'Token', variant: 'password', allowSecrets: true },
    { settings: { http: { bearerToken: '${secrets.test-secret-1}' } } }
  );

  expect(screen.getByRole('radio', { name: 'Secret' })).toBeChecked();

  await user.click(screen.getByRole('radio', { name: 'Value' }));

  expect(screen.getByRole('radio', { name: 'Value' })).toBeChecked();
  expect(screen.getByTestId(TestFormTestId.Value)).not.toHaveTextContent('secrets.test-secret-1');
});

it('links to the secrets config page in secret mode when no secrets exist', async () => {
  (useSecrets as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  const user = formTestRenderer(FormSecretOrPlaintextField, {
    field: FIELD,
    label: 'Token',
    variant: 'password',
    allowSecrets: true,
  });

  await user.click(screen.getByRole('radio', { name: 'Secret' }));

  const link = screen.getByRole('link', { name: /Create one in Config/i });
  expect(link).toHaveAttribute('href', expect.stringContaining('/config/secrets'));
});

it('keeps an existing secret reference in the submitted values when secrets are unavailable', async () => {
  // Secrets UI unavailable -> the read-only plaintext fallback renders. A disabled
  // input would be dropped from React Hook Form's submit payload; read-only is not.
  runTestAsSecretsNoAccess();
  const onSubmit = jest.fn();
  const user = userEvent.setup();

  function Harness() {
    const methods = useForm({ defaultValues: { settings: { http: { bearerToken: '${secrets.test-secret-1}' } } } });
    return (
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <FormSecretOrPlaintextField field={FIELD} label="Token" variant="password" allowSecrets />
          <button type="submit">Save</button>
        </form>
      </FormProvider>
    );
  }

  render(<Harness />);
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0][0]).toMatchObject({
    settings: { http: { bearerToken: '${secrets.test-secret-1}' } },
  });
});

it('reverts to Value mode when the form is reset to an empty value', async () => {
  const user = userEvent.setup();

  function Harness() {
    const methods = useForm({ defaultValues: { settings: { http: { bearerToken: '${secrets.test-secret-1}' } } } });
    return (
      <FormProvider {...methods}>
        <FormSecretOrPlaintextField field={FIELD} label="Token" variant="password" allowSecrets />
        <button type="button" onClick={() => methods.reset({ settings: { http: { bearerToken: '' } } })}>
          Reset form
        </button>
      </FormProvider>
    );
  }

  render(<Harness />);
  // Starts in Secret mode because the field holds a reference.
  expect(screen.getByRole('radio', { name: 'Secret' })).toBeChecked();

  await user.click(screen.getByRole('button', { name: 'Reset form' }));

  // A reset that empties the field must return the control to Value mode, not
  // leave an empty Secret picker.
  expect(screen.getByRole('radio', { name: 'Value' })).toBeChecked();
});

it('keeps Value mode usable when the secrets list fails to load', () => {
  // Value mode never calls the secrets API, so a failing secrets-list request
  // (which the Secret-mode error boundary would otherwise surface) must not
  // block plaintext entry.
  (useSecrets as jest.Mock).mockImplementation(() => {
    throw new Error('failed to load secrets');
  });

  formTestRenderer(FormSecretOrPlaintextField, {
    field: FIELD,
    label: 'Token',
    variant: 'password',
    allowSecrets: true,
  });

  expect(screen.getByRole('radio', { name: 'Value' })).toBeChecked();
  expect(screen.getByLabelText('Token')).toBeEnabled();
});
