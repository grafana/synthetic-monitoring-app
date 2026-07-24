import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MetricComparisonReading } from './MetricComparisonReading';

describe('MetricComparisonReading', () => {
  const readings = {
    plain: '8% faster',
    reference: '0.47 s',
  };

  it('cycles between the plain-language comparison and exact reference value', async () => {
    const user = userEvent.setup();
    render(
      <MetricComparisonReading
        caption="Compared to 30 days ago"
        metricLabel="Average latency"
        readings={readings}
      />
    );

    const button = screen.getByRole('button', { name: /Average latency comparison: 8% faster/ });

    expect(button).toHaveTextContent('8% faster');
    expect(button).toHaveTextContent('Compared to 30 days ago');
    expect(screen.queryByText('/')).not.toBeInTheDocument();
    expect(screen.queryByText('0.43 s selected · 0.47 s reference')).not.toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveTextContent('0.47 s');
    expect(button).toHaveTextContent('Compared to 30 days ago');
    expect(button).toHaveAccessibleName(
      'Average latency comparison: 0.47 s. Compared to 30 days ago. Show plain-language comparison'
    );
    expect(screen.queryByText('0.43 s selected · 0.47 s reference')).not.toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveTextContent('8% faster');
    expect(screen.queryByText('0.43 s selected · 0.47 s reference')).not.toBeInTheDocument();
    expect(button).not.toHaveTextContent('↓ 8%');
  });

  it('keeps independent state per metric and resets after remount', async () => {
    const user = userEvent.setup();
    const rendered = render(
      <>
        <MetricComparisonReading caption="Compared to 30 days ago" metricLabel="Latency" readings={readings} />
        <MetricComparisonReading caption="Compared to 30 days ago" metricLabel="Reachability" readings={readings} />
      </>
    );

    await user.click(screen.getByRole('button', { name: /Latency comparison/ }));

    expect(screen.getByRole('button', { name: /Latency comparison/ })).toHaveTextContent('0.47 s');
    expect(screen.getByRole('button', { name: /Reachability comparison/ })).toHaveTextContent('8% faster');

    rendered.unmount();
    render(<MetricComparisonReading caption="Compared to 30 days ago" metricLabel="Latency" readings={readings} />);

    expect(screen.getByRole('button', { name: /Latency comparison/ })).toHaveTextContent('8% faster');
  });

  it('names the next reading in its accessible label', () => {
    render(<MetricComparisonReading caption="Compared to 30 days ago" metricLabel="Latency" readings={readings} />);

    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Latency comparison: 8% faster. Compared to 30 days ago. Show exact reference value'
    );
  });
});
