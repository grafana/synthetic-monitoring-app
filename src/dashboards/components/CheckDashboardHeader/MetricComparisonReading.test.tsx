import React from 'react';
import { render, screen } from '@testing-library/react';

import { MetricComparisonReading } from './MetricComparisonReading';

describe('MetricComparisonReading', () => {
  const readings = {
    plain: '8% faster',
    reference: '0.47 s',
  };

  it('always shows the plain-language difference with the caption', () => {
    render(
      <MetricComparisonReading caption="Compared to 30 days ago" metricLabel="Average latency" readings={readings} />
    );

    const reading = screen.getByRole('status', { name: /Average latency comparison: 8% faster/ });

    expect(reading).toHaveTextContent('8% faster');
    expect(reading).toHaveTextContent('Compared to 30 days ago');
    expect(reading).not.toHaveTextContent('0.47 s');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('0.43 s selected · 0.47 s reference')).not.toBeInTheDocument();
  });

  it('names the metric, difference, and caption in its accessible label', () => {
    render(<MetricComparisonReading caption="Compared to 30 days ago" metricLabel="Latency" readings={readings} />);

    expect(screen.getByRole('status')).toHaveAccessibleName('Latency comparison: 8% faster. Compared to 30 days ago');
  });
});
