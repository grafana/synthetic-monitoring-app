import React from 'react';
import { config } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { Gauge } from './Gauge';
import { SuccessRateGaugeCheckReachability } from './SuccessRateGaugeCheckReachability';

// Exercise Grafana's rendering, including colors, instead of the shared BigValue stub.
jest.mock('@grafana/ui', () => jest.requireActual('@grafana/ui'));

describe('metric placeholders', () => {
  it('replaces the loading spinner with neutral text when the query returns NaN', async () => {
    let resolveResponse!: () => void;
    const response = new Promise<void>((resolve) => {
      resolveResponse = resolve;
    });
    server.use(
      apiRoute('getInstantMetrics', {
        result: async () => {
          await response;
          return {
            json: {
              status: 'success',
              data: {
                resultType: 'vector',
                result: [
                  {
                    metric: { job: BASIC_HTTP_CHECK.job, instance: BASIC_HTTP_CHECK.target },
                    value: [1598535155, 'NaN'],
                  },
                ],
              },
            },
          };
        },
      })
    );

    render(<SuccessRateGaugeCheckReachability check={BASIC_HTTP_CHECK} height={75} width={132} />);

    expect(await screen.findByTestId('Spinner')).toBeInTheDocument();
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();

    resolveResponse();

    expect(await screen.findByText('N/A')).toHaveStyle({ color: config.theme2.colors.text.secondary });
    expect(screen.queryByTestId('Spinner')).not.toBeInTheDocument();
  });

  it.each([null, NaN, Infinity, -Infinity])('shows a neutral placeholder for %s', async (value) => {
    render(<Gauge type="latency" unit="ms" value={value} height={75} width={148} />);

    expect(await screen.findByText('N/A')).toHaveStyle({ color: config.theme2.colors.text.secondary });
    expect(screen.queryByTestId('Spinner')).not.toBeInTheDocument();
  });

  it.each([
    { type: 'reachability' as const, unit: '%' as const, text: '0.0%', color: config.theme2.colors.error.shade },
    { type: 'latency' as const, unit: 'ms' as const, text: '0ms', color: config.theme2.colors.success.main },
  ])('keeps zero $type as a real measurement during a background refresh', async ({ type, unit, text, color }) => {
    render(<Gauge type={type} unit={unit} value={0} fetching height={75} width={148} />);

    expect(await screen.findByText(text)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(text)).toHaveStyle({ color }));
    expect(screen.queryByTestId('Spinner')).not.toBeInTheDocument();
  });
});
