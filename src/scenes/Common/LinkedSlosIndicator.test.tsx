import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { spyUsePluginFunctionsForSlos } from 'test/helpers/mockUsePluginFunctionsForSlos';
import { render } from 'test/render';

import type { Slo } from './useSmCheckSlos.types';

import { LinkedSlosIndicator } from './LinkedSlosIndicator';

describe('LinkedSlosIndicator', () => {
  let usePluginFunctionsSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    usePluginFunctionsSpy?.mockRestore();
  });

  it('shows linked SLO count when the SLO API returns matches', async () => {
    const matchingSlo: Slo = {
      uuid: 'slo-1',
      name: 'Test SLO',
      description: '',
      query: { type: 'freeform', freeform: { query: 'up' } },
      objectives: [{ value: 0.995, window: '30d' }],
      labels: [{ key: 'sm_check_id', value: String(BASIC_HTTP_CHECK.id) }],
    };

    usePluginFunctionsSpy = spyUsePluginFunctionsForSlos([matchingSlo]);

    render(<LinkedSlosIndicator check={BASIC_HTTP_CHECK} />);

    expect(await screen.findByRole('link', { name: '1 linked SLO' })).toBeInTheDocument();
  });

  it('renders nothing when there are no matching SLOs', async () => {
    usePluginFunctionsSpy = spyUsePluginFunctionsForSlos([]);

    render(<LinkedSlosIndicator check={BASIC_HTTP_CHECK} />);

    await waitFor(() => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
