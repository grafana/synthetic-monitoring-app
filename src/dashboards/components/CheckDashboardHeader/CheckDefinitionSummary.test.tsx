import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  it('renders operational configuration separately from check identity', () => {
    render(<CheckDefinitionSummary model={dnsModel} />);

    const configuration = screen.getByRole('region', { name: 'Check configuration' });

    expect(within(configuration).queryByRole('heading', { name: 'Check configuration' })).not.toBeInTheDocument();
    expect(within(configuration).getByText('8.8.8.8 · UDP 53')).toBeVisible();
    expect(within(configuration).getByRole('button', { name: 'View check definition' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Authoritative DNS' })).not.toBeInTheDocument();
    expect(screen.queryByText('team: networking')).not.toBeInTheDocument();
  });

  it('reveals definition detail only when its toggletip is opened', async () => {
    const user = userEvent.setup();
    render(<CheckDefinitionSummary model={dnsModel} />);

    expect(screen.queryByText('Recursion')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View check definition' }));

    expect(screen.getByText('DNS check definition')).toBeVisible();
    expect(screen.getByText('Recursion')).toBeVisible();
    expect(screen.getByText('Disabled')).toBeVisible();
  });
});
