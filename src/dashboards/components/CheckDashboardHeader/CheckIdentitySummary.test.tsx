import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';

import { CheckIdentitySummary } from './CheckIdentitySummary';

const METHOD_COLOR = 'rgb(115, 191, 105)';

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

const httpModel: CheckHeaderDefinitionModel = {
  title: 'HTTP check',
  typeLabel: 'HTTP',
  qualifier: {
    text: 'GET',
    getColor: () => METHOD_COLOR,
  },
  target: { value: 'https://example.com/', accessibleLabel: 'Target URL' },
  facts: [],
  labels: [],
};

describe('CheckIdentitySummary', () => {
  it('keeps identifying metadata together without operational configuration', () => {
    render(<CheckIdentitySummary model={dnsModel} actions={<button type="button">Edit</button>} />);

    expect(screen.getByRole('region', { name: 'Check identity' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Authoritative DNS' })).toBeVisible();
    expect(screen.queryByLabelText('Check type')).not.toBeInTheDocument();
    const metadata = screen.getByTestId('check-identity-metadata');
    expect(within(metadata).getByText('A')).toBeVisible();
    expect(within(metadata).getByText('example.com')).toBeVisible();
    expect(screen.queryByText('team: networking')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
    expect(screen.queryByText('8.8.8.8 · UDP 53')).not.toBeInTheDocument();
  });

  it('shows a running status pill and metadata beside the actions', () => {
    render(
      <CheckIdentitySummary
        model={httpModel}
        status={{ label: 'Running', running: true }}
        meta={[
          { id: 'created', label: 'Created', value: 'Jan 12, 2024' },
          { id: 'updated', label: 'Updated', value: 'Jul 6, 2026', title: 'July 06, 2026, 09:00 AM' },
        ]}
        actions={<button type="button">Pause</button>}
      />
    );

    expect(screen.getByTestId('check-identity-status')).toHaveTextContent('Running');
    const meta = screen.getByLabelText('Check metadata');
    expect(within(meta).getByText('Created')).toBeVisible();
    expect(within(meta).getByText('Jan 12, 2024')).toBeVisible();
    expect(within(meta).getByText('Updated')).toBeVisible();
    expect(within(meta).getByText('Jul 6, 2026')).toHaveAttribute('title', 'July 06, 2026, 09:00 AM');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  it('renders a paused status pill when the check is not running', () => {
    render(<CheckIdentitySummary model={httpModel} status={{ label: 'Paused', running: false }} />);

    expect(screen.getByTestId('check-identity-status')).toHaveTextContent('Paused');
  });

  it('prefixes the target with a colour-coded method for HTTP checks', () => {
    render(<CheckIdentitySummary model={httpModel} />);

    expect(screen.queryByLabelText('Check type')).not.toBeInTheDocument();
    const metadata = screen.getByTestId('check-identity-metadata');
    const method = within(metadata).getByText('GET');
    expect(method).toBeVisible();
    expect(method).toHaveStyle({ color: METHOD_COLOR });
    expect(within(metadata).getByText('https://example.com/')).toBeVisible();
  });
});
