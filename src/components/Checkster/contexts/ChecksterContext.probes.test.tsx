import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { DEPRECATED_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';
import { probeToMetadataProbe } from 'test/utils';

import * as probesData from 'data/useProbes';

import { ChecksterProvider, useChecksterContext } from './ChecksterContext';

jest.mock('data/useProbes', () => ({
  ...jest.requireActual('data/useProbes'),
  useProbesWithMetadata: jest.fn(),
}));

it('keeps the schema stable on probe refreshes but updates it when deprecation changes', async () => {
  const probe = probeToMetadataProbe(DEPRECATED_PROBE);
  const useProbes = jest.mocked(probesData.useProbesWithMetadata);
  useProbes.mockReturnValue({ data: [probe], isLoading: false });
  const observed = jest.fn();
  function ObserveSchema() {
    const { schema } = useChecksterContext();
    observed(schema);
    return <div>Schema ready</div>;
  }
  const ui = () => (
    <ChecksterProvider check={BASIC_HTTP_CHECK}>
      <ObserveSchema />
    </ChecksterProvider>
  );
  try {
    const { rerender } = render(ui());
    await screen.findByText('Schema ready');
    const initialSchema = observed.mock.lastCall![0];

    useProbes.mockReturnValue({ data: [{ ...probe }], isLoading: false });
    rerender(ui());
    expect(observed.mock.lastCall![0]).toBe(initialSchema);

    useProbes.mockReturnValue({ data: [{ ...probe, deprecated: false }], isLoading: false });
    rerender(ui());
    expect(observed.mock.lastCall![0]).not.toBe(initialSchema);
  } finally {
    useProbes.mockReset();
  }
});
