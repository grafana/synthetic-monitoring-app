import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';

import { CheckDefinitionSummary } from './CheckDefinitionSummary';

const dnsModel: CheckHeaderDefinitionModel = {
  title: 'Authoritative DNS',
  typeLabel: 'DNS',
  qualifier: { text: 'A' },
  target: { value: 'example.com', accessibleLabel: 'Record name example.com' },
  facts: [{ id: 'resolver', label: 'Resolver', value: '8.8.8.8 · UDP 53', icon: 'clock-nine' }],
  labels: [{ name: 'team', value: 'networking' }],
  details: {
    title: 'DNS check definition',
    items: [{ id: 'recursion', label: 'Recursion', value: 'Disabled' }],
  },
};

describe('CheckDefinitionSummary', () => {
  it('presents the check definition as a labelled rail of configuration facts alongside labels', () => {
    render(<CheckDefinitionSummary model={dnsModel} />);

    const definition = screen.getByRole('region', { name: 'Check definition' });
    const configuration = within(definition).getByLabelText('Check configuration');
    // The check type now leads the configuration rail.
    expect(within(configuration).getByLabelText('Check type')).toHaveTextContent('DNS');
    const factRow = within(configuration).getByText('Resolver').closest('dl > div');
    expect(within(configuration).getByText('Resolver')).toBeVisible();
    expect(within(configuration).getByText('8.8.8.8 · UDP 53')).toBeVisible();
    // Facts that carry an icon render it inside their stat.
    expect(factRow?.querySelector('svg')).toBeInTheDocument();

    const labels = within(definition).getByLabelText('Labels');
    expect(within(labels).getByText('team: networking')).toBeVisible();

    // No section heading, and identity content is not duplicated here.
    expect(within(definition).queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Authoritative DNS' })).not.toBeInTheDocument();
  });
});
