import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChecksPage } from './ChecksPage';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';
jest.setTimeout(20000);

interface RenderArgs {
  checkId?: string;
}

const renderChecksPage = ({ checkId }: RenderArgs = {}) => {
  const instance = getInstanceMock();
  render(<ChecksPage instance={{ api: instance }} id={checkId} />);
};

test('renders checks', () => {
  renderChecksPage();
  waitFor(() => expect(screen.getByText('a jobname')).toBeInTheDocument());
});

test('renders check editor new check', async () => {
  renderChecksPage();
  await waitFor(() => screen.getByRole('button', { name: 'New Check' }));
  userEvent.click(screen.getByRole('button', { name: 'New Check' }));
  expect(await screen.findByText('Add Check')).toBeInTheDocument();
});

test('renders check editor existing check', () => {
  renderChecksPage({ checkId: '1' });
  waitFor(() => expect(screen.getByText('Edit Check')).toBeInTheDocument());
});
