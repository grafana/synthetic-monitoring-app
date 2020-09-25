import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChecksPage } from './ChecksPage';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';

interface RenderArgs {
  checkId?: string;
}

const renderChecksPage = ({ checkId }: RenderArgs = {}) => {
  const instance = getInstanceMock();
  render(<ChecksPage instance={{ api: instance }} id={checkId} />);
};

test('renders check editor existing check', () => {
  renderChecksPage();
  waitFor(() => expect(screen.getByText('Edit Check')).toBeInTheDocument());
});
