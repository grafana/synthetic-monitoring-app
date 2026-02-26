import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { MOCKED_SECRETS_API_RESPONSE } from 'test/fixtures/secrets';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render as testRender } from 'test/render';
import { server } from 'test/server';

import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretEditModal } from './SecretEditModal';

async function render(element: React.ReactElement) {
  const result = testRender(<div data-testid={DataTestIds.ConfigContent}>{element}</div>);
  await waitFor(() => expect(screen.getByTestId(DataTestIds.ConfigContent)).toBeInTheDocument(), {
    timeout: 3000,
  });

  return result;
}

describe('SecretEditModal', () => {
  const defaultProps = {
    name: SECRETS_EDIT_MODE_ADD,
    onDismiss: jest.fn(),
    open: true,
    source: 'config_page_secrets_tab',
  } as const;

  it('should not render when open is false', async () => {
    await render(<SecretEditModal {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render create secret form for new secret', async () => {
    await render(<SecretEditModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create secret')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Value/)).toBeInTheDocument();
  });

  it('should render edit secret form for existing secret', async () => {
    const [secret1] = MOCKED_SECRETS_API_RESPONSE.secrets; // getSecret returns first secret, this must be the same as secret1
    await render(<SecretEditModal {...defaultProps} name={secret1.name} />);

    expect(screen.getByText('Edit secret')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue(secret1.description)).toBeInTheDocument(), { timeout: 3000 });
    secret1.labels.forEach((label) => {
      expect(screen.getByDisplayValue(label.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(label.value)).toBeInTheDocument();
    });
  });

  it('should handle adding and removing labels', async () => {
    const { user } = await render(<SecretEditModal {...defaultProps} />);

    const addLabelButton = screen.getByText('Add label');
    await user.click(addLabelButton);

    const nameInput = screen.getByPlaceholderText('name');
    const valueInput = screen.getByPlaceholderText('value');

    await user.type(nameInput, 'label1');
    await user.type(valueInput, 'value1');

    expect(nameInput).toHaveValue('label1');
    expect(valueInput).toHaveValue('value1');

    const removeButton = screen.getByLabelText('Remove label');
    await user.click(removeButton);

    expect(screen.queryByPlaceholderText('name')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('value')).not.toBeInTheDocument();
  });

  it('should show error message when secret fetch fails', async () => {
    server.use(
      apiRoute('getSecret', {
        result: () => ({
          status: 500,
          json: { message: 'Internal server error' },
        }),
      })
    );

    const [secret1] = MOCKED_SECRETS_API_RESPONSE.secrets; // getSecret returns first secret, this must be the same as secret1
    await render(<SecretEditModal {...defaultProps} name={secret1.name} />);

    expect(await screen.findByText('Unable to fetch secret')).toBeInTheDocument();
    expect(await screen.findByText(/request failed with status code 500/i)).toBeInTheDocument();
  });

  it('should submit form with correct values', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('createSecret', {}, record));
    const { user } = await render(<SecretEditModal {...defaultProps} />);

    const inputValues = {
      name: 'New Secret', // should be transformed to 'new-secret'
      description: 'My short description',
      plaintext: 'secret-value',
    };

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: inputValues.name } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: inputValues.description } });
    fireEvent.change(screen.getByLabelText(/Value/), { target: { value: inputValues.plaintext } });

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    const { body } = await read();

    expect(body).toStrictEqual({
      ...inputValues,
      name: 'new-secret', // transformed to lowercase and spaces replaced with dashes
      labels: [],
    });
  });

  it('should call onDismiss after successful save', async () => {
    const { user } = await render(<SecretEditModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'New Secret' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'My short description' } });
    fireEvent.change(screen.getByLabelText(/Value/), { target: { value: 'secret-value' } });

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should show error when save fails', async () => {
    server.use(
      apiRoute('createSecret', {
        result: () => ({
          status: 500,
          body: 'Internal server error',
        }),
      })
    );

    const { user } = await render(<SecretEditModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'New Secret' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Short description' } });
    fireEvent.change(screen.getByLabelText(/Value/), { target: { value: 'secret-value' } });

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    expect(screen.getByText('Unable to save secret')).toBeInTheDocument();
    expect(screen.getByText(/request failed with status code 500/i)).toBeInTheDocument();
  });

  it('should be possible to add labels to the secret', async () => {
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    const inputValues = {
      name: secretMock.name,
      description: secretMock.description,
      plaintext: 'secret-value',
    };

    const { name: labelName, value: labelValue } = secretMock.labels[0];

    const { record, read } = getServerRequests();
    server.use(apiRoute('createSecret', {}, record));
    const { user } = await render(<SecretEditModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: inputValues.name } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: inputValues.description } });
    fireEvent.change(screen.getByLabelText(/Value/), { target: { value: inputValues.plaintext } });

    await user.click(screen.getByText('Add label'));

    await user.type(screen.getByPlaceholderText('name'), labelName);
    await user.type(screen.getByPlaceholderText('value'), labelValue);

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    const { body } = await read();

    expect(body.labels).toStrictEqual([
      {
        name: labelName,
        value: labelValue,
      },
    ]);
  });

  it('should be possible to remove labels from the secret', async () => {
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];

    expect(secretMock.labels.length).toBeGreaterThan(0); // Ensure there are labels to remove

    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const { user } = await render(<SecretEditModal {...defaultProps} name={secretMock.name} />);

    const removeLabelButtons = await screen.findAllByLabelText('Remove label');
    for (const element of removeLabelButtons) {
      await user.click(element);
    }

    await user.click(screen.getByText('Save'));

    const { body } = await read();

    expect(body.labels).toStrictEqual([]);
  });

  it('should not be possible to change name for existing secret', async () => {
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    const inputValues = {
      name: secretMock.name,
      description: secretMock.description,
    };
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const { user } = await render(<SecretEditModal {...defaultProps} name={secretMock.name} />);

    expect(screen.getByLabelText(/Name/)).toHaveAttribute('readonly');

    await user.type(screen.getByLabelText(/Description/), inputValues.description);

    await user.click(screen.getByText('Save'));

    const { body } = await read();

    expect(body.name).toBeUndefined();
  });

  it('should show value textarea as disabled when configured', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    const { user } = await render(<SecretEditModal {...defaultProps} name={secretMock.name} />);

    const valueInput = screen.getByLabelText(/value/i);
    expect(valueInput).toBeDisabled();
    expect(valueInput).toHaveValue('configured');

    await user.click(screen.getByText('Save'));

    const { body } = await read();

    expect(body.plaintext).toBeUndefined();
  });

  it('should be possible to reset the value', async () => {
    const newSecretValue = 'new secret value';
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    const { user } = await render(<SecretEditModal {...defaultProps} name={secretMock.name} />);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.type(screen.getByLabelText(/value/i), newSecretValue);

    await user.click(screen.getByText('Save'));

    const { body } = await read();

    expect(body.plaintext).toBe(newSecretValue);
  });

  it('should show error message when secret name is already taken', async () => {
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    const inputValues = {
      name: secretMock.name,
      description: 'My short description',
      plaintext: 'secret-value',
    };

    const { user } = await render(<SecretEditModal {...defaultProps} existingNames={[secretMock.name]} />);

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: inputValues.name } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: inputValues.description } });
    fireEvent.change(screen.getByLabelText(/Value/), { target: { value: inputValues.plaintext } });

    const submitButton = screen.getByText('Save');
    await user.click(submitButton);

    expect(screen.getByText('A secret with this name already exists')).toBeInTheDocument();
  });
});
