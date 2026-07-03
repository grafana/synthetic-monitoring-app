import { screen } from '@testing-library/react';
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
