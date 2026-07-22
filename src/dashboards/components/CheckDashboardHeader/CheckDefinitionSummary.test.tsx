import React from 'react';
import { render, screen } from '@testing-library/react';
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
  it('renders a check-agnostic flattened definition and action slot', () => {
    render(<CheckDefinitionSummary model={dnsModel} actions={<button type="button">Edit</button>} />);

    expect(screen.getByRole('heading', { name: 'Authoritative DNS' })).toBeVisible();
    expect(screen.getByText('DNS')).toBeVisible();
    expect(screen.getByText('A')).toBeVisible();
    expect(screen.getByLabelText('Record name example.com')).toHaveTextContent('example.com');
    expect(screen.getByText('8.8.8.8 · UDP 53')).toBeVisible();
    expect(screen.getByText('team: networking')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
    expect(screen.queryByText('Enabled')).not.toBeInTheDocument();
  });

  it('pads both halves of the compound type badge', () => {
    render(<CheckDefinitionSummary model={dnsModel} />);

    expect(screen.getByText('DNS')).toHaveStyle({ padding: '2px 8px' });
    expect(screen.getByText('A')).toHaveStyle({ padding: '2px 8px' });
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
