import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TenantAPISetupForm from './TenantAPISetupForm';

test('submits just an apiKey if no advanced', async () => {
  const onSubmitMock = jest.fn();
  render(<TenantAPISetupForm onSubmit={onSubmitMock} />);
  const apiKeyInput = await screen.findByLabelText('Admin API Key', { exact: false });
  await userEvent.type(apiKeyInput, 'anapikey', { delay: 5 });
  const submitButton = await screen.findByRole('button', { name: 'Initialize' });
  // Validation on change makes the <Form> component misbehave and has to be wrapped in an act call
  await act(async () => {
    userEvent.click(submitButton);
  });
  expect(onSubmitMock).toHaveBeenCalledWith({ adminApiToken: 'anapikey' });
});

test('host url has default', async () => {
  const onSubmitMock = jest.fn();
  render(<TenantAPISetupForm onSubmit={onSubmitMock} />);
  const apiKeyInput = await screen.findByLabelText('Admin API Key', { exact: false });
  await userEvent.type(apiKeyInput, 'anapikey', { delay: 5 });
  const advanced = await screen.findByText('Advanced');
  userEvent.click(advanced);
  const submitButton = await screen.findByRole('button', { name: 'Initialize' });
  await act(async () => {
    userEvent.click(submitButton);
  });
  expect(onSubmitMock).toHaveBeenCalledWith({
    adminApiToken: 'anapikey',
    apiHost: 'https://synthetic-monitoring-api.grafana.net',
  });
});

test('submits host url', async () => {
  const onSubmitMock = jest.fn();
  render(<TenantAPISetupForm onSubmit={onSubmitMock} />);
  const apiKeyInput = await screen.findByLabelText('Admin API Key', { exact: false });
  await userEvent.type(apiKeyInput, 'anapikey', { delay: 5 });
  const advanced = await screen.findByText('Advanced');
  userEvent.click(advanced);
  const hostInput = await screen.findByLabelText('Backend Address');
  await userEvent.clear(hostInput);
  const submitButton = await screen.findByRole('button', { name: 'Initialize' });
  await act(async () => {
    await userEvent.type(hostInput, 'https://grafana.com');
    userEvent.click(submitButton);
  });
  expect(onSubmitMock).toHaveBeenCalledWith({ adminApiToken: 'anapikey', apiHost: 'https://grafana.com' });
});

test('validates host url', async () => {
  const onSubmitMock = jest.fn();
  render(<TenantAPISetupForm onSubmit={onSubmitMock} />);
  const advanced = await screen.findByText('Advanced');
  userEvent.click(advanced);
  const hostInput = await screen.findByLabelText('Backend Address');
  await userEvent.clear(hostInput);
  await act(async () => {
    await userEvent.type(hostInput, 'totes not a valid url');
  });
  const errorMessage = 'Invalid URL: totes not a valid url';
  expect(await screen.findByText(errorMessage, { exact: false })).toBeInTheDocument();
});

test('shows submission erros', async () => {
  const onSubmitMock = jest.fn();
  render(<TenantAPISetupForm onSubmit={onSubmitMock} submissionError="submitting went wrong" />);
  expect(await screen.findByText('submitting went wrong')).toBeInTheDocument();
});
