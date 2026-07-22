import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';

import { CheckIdentitySummary } from './CheckIdentitySummary';

const dnsModel: CheckHeaderDefinitionModel = {
  title: 'Authoritative DNS',
  typeLabel: 'DNS',
  qualifier: { text: 'A' },
  target: { value: 'example.com', accessibleLabel: 'Record name example.com' },
  facts: [{ id: 'resolver', label: 'Resolver', value: '8.8.8.8 · UDP 53' }],
  labels: [{ name: 'team', value: 'networking' }],
  details: {
    title: 'DNS check definition',
    items: [{ id: 'recursion', label: 'Recursion', value: 'Disabled' }],
  },
};

describe('CheckIdentitySummary', () => {
  it('keeps identifying metadata together without operational configuration', () => {
    render(<CheckIdentitySummary model={dnsModel} actions={<button type="button">Edit</button>} />);

    expect(screen.getByRole('region', { name: 'Check identity' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Authoritative DNS' })).toBeVisible();
    expect(screen.getByText('DNS')).toBeVisible();
    expect(screen.getByText('A')).toBeVisible();
    const metadata = screen.getByTestId('check-identity-metadata');
    expect(within(metadata).getByLabelText('Record name example.com')).toHaveTextContent('example.com');
    expect(within(metadata).getByText('team: networking')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
    expect(screen.queryByText('8.8.8.8 · UDP 53')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View check definition' })).not.toBeInTheDocument();
  });

  it('pads both halves of the compound type badge', () => {
    render(<CheckIdentitySummary model={dnsModel} />);

    expect(screen.getByText('DNS')).toHaveStyle({ padding: '2px 8px' });
    expect(screen.getByText('A')).toHaveStyle({ padding: '2px 8px' });
  });
});
