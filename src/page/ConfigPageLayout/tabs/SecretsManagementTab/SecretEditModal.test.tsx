import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTestIds } from 'test/dataTestIds';
import { MOCKED_SECRETS_API_RESPONSE } from 'test/fixtures/secrets';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render as testRender } from 'test/render';
import { server } from 'test/server';

import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretEditModal } from './SecretEditModal';

async function render(element: React.ReactElement) {
  const result = testRender(<div data-testid={DataTestIds.CONFIG_CONTENT}>{element}</div>);
  await waitFor(() => expect(screen.getByTestId(DataTestIds.CONFIG_CONTENT)).toBeInTheDocument(), {
    timeout: 3000,
  });

  return result;
}

describe('SecretEditModal', () => {
  const defaultProps = {
    id: SECRETS_EDIT_MODE_ADD,
    onDismiss: jest.fn(),
    open: true,
  };

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
    await render(<SecretEditModal {...defaultProps} id={secret1.uuid} />);

    expect(screen.getByText('Edit secret')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue(secret1.description)).toBeInTheDocument(), { timeout: 3000 });
    secret1.labels.forEach((label) => {
      expect(screen.getByDisplayValue(label.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(label.value)).toBeInTheDocument();
    });
  });

  it('should handle adding and removing labels', async () => {
    await render(<SecretEditModal {...defaultProps} />);

    const addLabelButton = screen.getByText('Add label');
    await userEvent.click(addLabelButton);

    const nameInput = screen.getByPlaceholderText('name');
    const valueInput = screen.getByPlaceholderText('value');

    await userEvent.type(nameInput, 'label1');
    await userEvent.type(valueInput, 'value1');

    expect(nameInput).toHaveValue('label1');
    expect(valueInput).toHaveValue('value1');

    const removeButton = screen.getByLabelText('Remove label');
    await userEvent.click(removeButton);

    expect(screen.queryByPlaceholderText('name')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('value')).not.toBeInTheDocument();
  });

  it('should show error message when secret fetch fails', async () => {
    server.use(
      apiRoute('getSecret', {
        result: () => ({
          status: 500,
          body: 'Internal server error',
        }),
      })
    );

    const [secret1] = MOCKED_SECRETS_API_RESPONSE.secrets; // getSecret returns first secret, this must be the same as secret1
    await render(<SecretEditModal {...defaultProps} id={secret1.uuid} />);

    expect(screen.getByText('Unable to fetch secret')).toBeInTheDocument();
    expect(screen.getByText(/request failed with status code 500/i)).toBeInTheDocument();
  });

  it('should submit form with correct values', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('createSecret', {}, record));
    await render(<SecretEditModal {...defaultProps} />);

    const inputValues = {
      name: 'New Secret', // should be transformed to 'new-secret'
      description: 'My short description',
      plaintext: 'secret-value',
    };

    await userEvent.type(screen.getByLabelText(/Name/), inputValues.name); // Should be transformed to 'new-secret'
    await userEvent.type(screen.getByLabelText(/Description/), inputValues.description);
    await userEvent.type(screen.getByLabelText(/Value/), inputValues.plaintext);

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

    const { body } = await read();

    expect(body).toStrictEqual({
      ...inputValues,
      name: 'new-secret', // transformed to lowercase and spaces replaced with dashes
      labels: [],
    });
  });

  it('should call onDismiss after successful save', async () => {
    await render(<SecretEditModal {...defaultProps} />);

    await userEvent.type(screen.getByLabelText(/Name/), 'New Secret');
    await userEvent.type(screen.getByLabelText(/Description/), 'My short description');
    await userEvent.type(screen.getByLabelText(/Value/), 'secret-value');

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

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

    await render(<SecretEditModal {...defaultProps} />);

    await userEvent.type(screen.getByLabelText(/Name/), 'New Secret');
    await userEvent.type(screen.getByLabelText(/Description/), 'Short description');
    await userEvent.type(screen.getByLabelText(/Value/), 'secret-value');

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

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
    await render(<SecretEditModal {...defaultProps} />);

    await userEvent.type(screen.getByLabelText(/Name/), inputValues.name); // Should be transformed to 'new-secret'
    await userEvent.type(screen.getByLabelText(/Description/), inputValues.description);
    await userEvent.type(screen.getByLabelText(/Value/), inputValues.plaintext);

    await userEvent.click(screen.getByText('Add label'));

    await userEvent.type(screen.getByPlaceholderText('name'), labelName);
    await userEvent.type(screen.getByPlaceholderText('value'), labelValue);

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

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
    const inputValues = {
      name: secretMock.name,
      description: secretMock.description,
      plaintext: 'secret-value',
    };

    expect(secretMock.labels.length).toBeGreaterThan(0); // Ensure there are labels to remove

    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    await render(<SecretEditModal {...defaultProps} id={secretMock.uuid} />);

    await userEvent.type(screen.getByLabelText(/Name/), inputValues.name); // Should be transformed to 'new-secret'
    await userEvent.type(screen.getByLabelText(/Description/), inputValues.description);

    // Remove all labels
    const removeLabelButtons = screen.getAllByLabelText('Remove label');
    for (const element of removeLabelButtons) {
      await userEvent.click(element);
    }

    await userEvent.click(screen.getByText('Save'));

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
    await render(<SecretEditModal {...defaultProps} id={secretMock.uuid} />);

    expect(screen.getByLabelText(/Name/)).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Description/), inputValues.description);

    await userEvent.click(screen.getByText('Save'));

    const { body } = await read();

    expect(body.name).toBeUndefined(); // The name should not be sent in the request
  });

  it('should show value textarea as disabled when configured', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    await render(<SecretEditModal {...defaultProps} id={secretMock.uuid} />);

    const valueInput = screen.getByLabelText(/value/i);
    expect(valueInput).toBeDisabled();
    expect(valueInput).toHaveValue('configured');

    await userEvent.click(screen.getByText('Save'));

    const { body } = await read();

    expect(body.plaintext).toBeUndefined(); // The plaintext should not be sent in the request
  });

  it('should be possible to reset the value', async () => {
    const newSecretValue = 'new secret value';
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    await render(<SecretEditModal {...defaultProps} id={secretMock.uuid} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await userEvent.type(screen.getByLabelText(/value/i), newSecretValue);

    await userEvent.click(screen.getByText('Save'));

    const { body } = await read();

    expect(body.plaintext).toBe(newSecretValue);
  });

  it('should show error message when secret name is already taken', async () => {
    const secretMock = MOCKED_SECRETS_API_RESPONSE.secrets[0];
    const inputValues = {
      name: secretMock.name, // should be transformed to 'new-secret'
      description: 'My short description',
      plaintext: 'secret-value',
    };

    await render(<SecretEditModal {...defaultProps} existingNames={[secretMock.name]} />);

    await userEvent.type(screen.getByLabelText(/Name/), inputValues.name); // Should be transformed to 'new-secret'
    await userEvent.type(screen.getByLabelText(/Description/), inputValues.description);
    await userEvent.type(screen.getByLabelText(/Value/), inputValues.plaintext);

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

    expect(screen.getByText('A secret with this name already exists')).toBeInTheDocument();
  });
});
