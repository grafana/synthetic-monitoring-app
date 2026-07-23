import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';

import { CheckDefinitionSummary } from './CheckDefinitionSummary';

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

describe('CheckDefinitionSummary', () => {
  it('renders operational configuration with labels on the same row', () => {
    render(<CheckDefinitionSummary model={dnsModel} />);

    const configuration = screen.getByRole('region', { name: 'Check configuration' });
    const labels = within(configuration).getByLabelText('Labels');
    const factList = within(configuration).getByText('Resolver').closest('dl');

    expect(within(configuration).queryByRole('heading', { name: 'Check configuration' })).not.toBeInTheDocument();
    expect(within(configuration).getByText('8.8.8.8 · UDP 53')).toBeVisible();
    expect(within(labels).getByText('team: networking')).toBeVisible();
    expect(factList?.parentElement).toContainElement(labels);
    expect(screen.queryByRole('button', { name: 'View check definition' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Authoritative DNS' })).not.toBeInTheDocument();
  });
});
