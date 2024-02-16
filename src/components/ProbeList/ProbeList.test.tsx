import React from 'react';
import { screen } from '@testing-library/react';
import { DEFAULT_PROBES } from 'test/fixtures/probes';
import { render } from 'test/render';

import { ProbeList } from './ProbeList';
import 'test/silenceErrors';

const TITLE = `Default Probes`;

it(`Toggles visibility of the probe cards`, async () => {
  const { user } = render(<ProbeList probes={DEFAULT_PROBES} title={TITLE} />);
  const cards = await screen.findAllByText(`Reachability`);
  const title = screen.getByText(TITLE);

  // shows cards by default
  cards.forEach((card) => {
    expect(card).toBeVisible();
  });

  await user.click(title);
  cards.forEach((card) => {
    expect(card).not.toBeVisible();
  });

  await user.click(title);
  cards.forEach((card) => {
    expect(card).toBeVisible();
  });
});
