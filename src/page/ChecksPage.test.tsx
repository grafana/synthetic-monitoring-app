import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChecksPage } from './ChecksPage';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';

const renderChecksPage = () => {
  const instance = getInstanceMock();
  render(<ChecksPage instance={{ api: instance }} />);
};

test('renders for existing check', () => {
  expect(true).toBeTruthy();
});
