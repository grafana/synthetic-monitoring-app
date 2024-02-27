import React from 'react';
import { screen } from '@testing-library/react';
import { DEFAULT_PROBES, PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { Probe } from 'types';

import { ProbeRegionsSelect } from './ProbeRegionsSelect';

describe(`<ProbeRegionsSelect />`, () => {
  it(`shows all existing regions in region select`, async () => {
    const { user } = render(<ProbeRegionsSelect id="test" onChange={jest.fn} />);
    const regionInput = await screen.findByText(`Add or select a region`);
    await user.click(regionInput);

    DEFAULT_PROBES.forEach((probe) => {
      expect(screen.getByText(probe.region)).toBeInTheDocument();
    });
  });

  it(`doesn't repeat regions in region select`, async () => {
    const repeatedProbe: Probe = { ...DEFAULT_PROBES[0], id: 4 };

    server.use(
      apiRoute(`listProbes`, {
        result: () => {
          return {
            json: [...DEFAULT_PROBES, repeatedProbe],
          };
        },
      })
    );

    const { user } = render(<ProbeRegionsSelect id="test" onChange={jest.fn} />);
    const regionInput = await screen.findByText(`Add or select a region`);
    await user.click(regionInput);

    DEFAULT_PROBES.forEach((probe) => {
      // should error if more than one region is found
      expect(screen.getByText(probe.region)).toBeInTheDocument();
    });
  });
});
