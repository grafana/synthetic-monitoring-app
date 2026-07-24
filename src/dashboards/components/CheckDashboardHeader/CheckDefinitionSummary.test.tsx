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
  it('groups configuration and labels under headings on the same row', () => {
    render(<CheckDefinitionSummary model={dnsModel} />);

    const configuration = screen.getByRole('region', { name: 'Check configuration' });
    const labels = within(configuration).getByLabelText('Labels');
    const factList = within(configuration).getByText('Resolver').closest('dl');
    const factPill = within(configuration).getByText('Resolver').closest('dl > div');
    const configGroup = factList?.parentElement;
    const labelsGroup = labels.parentElement;

    expect(within(configuration).queryByRole('heading', { name: 'Check configuration' })).not.toBeInTheDocument();
    expect(within(configuration).getByText('Configuration')).toBeVisible();
    expect(within(configuration).getByText('Labels')).toBeVisible();
    expect(within(configuration).getByText('8.8.8.8 · UDP 53')).toBeVisible();
    // Facts that carry an icon render it inside their pill.
    expect(factPill?.querySelector('svg')).toBeInTheDocument();
    expect(within(labels).getByText('team: networking')).toBeVisible();
    // Configuration and Labels are distinct groups that still share one row.
    expect(configGroup).not.toBe(labelsGroup);
    expect(configGroup?.parentElement).toBe(labelsGroup?.parentElement);
    expect(screen.queryByRole('button', { name: 'View check definition' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Authoritative DNS' })).not.toBeInTheDocument();
  });
});
