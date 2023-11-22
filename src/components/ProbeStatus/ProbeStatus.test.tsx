import React from 'react';
import { screen } from '@testing-library/react';
import { OFFLINE_PROBE, ONLINE_PROBE, PRIVATE_PROBE } from 'test/fixtures';
import { render } from 'test/render';
import { runTestAsViewer } from 'test/utils';

import { formatDate } from 'utils';

import { ProbeStatus } from './ProbeStatus';

it(`shows the reset probe access token when the user is an editor`, async () => {
  render(<ProbeStatus probe={PRIVATE_PROBE} onReset={jest.fn()} />);
  const resetButton = await getResetButton();
  expect(resetButton).toBeInTheDocument();
});

it(`shows the reset probe access token when the user is an editor`, async () => {
  runTestAsViewer();
  await render(<ProbeStatus probe={PRIVATE_PROBE} onReset={jest.fn()} />);
  const resetButton = await getResetButton();
  expect(resetButton).not.toBeInTheDocument();
});

describe(`Last on/offline display`, () => {
  it(`displays last online: 'never' correctly`, () => {
    const neverOnline = {
      ...OFFLINE_PROBE,
      onlineChange: OFFLINE_PROBE.created!,
    };

    render(<ProbeStatus probe={neverOnline} onReset={jest.fn()} />);
    expect(screen.getByText('Last online:')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it(`displays last online correctly`, () => {
    render(<ProbeStatus probe={OFFLINE_PROBE} onReset={jest.fn()} />);
    expect(screen.getByText('Last online:')).toBeInTheDocument();
    expect(screen.getByText(formatDate(OFFLINE_PROBE.onlineChange * 1000))).toBeInTheDocument();
  });

  it(`displays last offline correctly`, () => {
    render(<ProbeStatus probe={ONLINE_PROBE} onReset={jest.fn()} />);
    expect(screen.getByText('Last offline:')).toBeInTheDocument();
    expect(screen.getByText(formatDate(ONLINE_PROBE.onlineChange * 1000))).toBeInTheDocument();
  });
});

describe(`Last modified display`, () => {
  it(`displays last modified: 'never' correctly`, () => {
    const neverModified = {
      ...OFFLINE_PROBE,
      modified: OFFLINE_PROBE.created,
    };

    render(<ProbeStatus probe={neverModified} onReset={jest.fn()} />);
    expect(screen.getByText('Last modified:')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it(`displays last modified correctly`, () => {
    render(<ProbeStatus probe={ONLINE_PROBE} onReset={jest.fn()} />);
    expect(screen.getByText('Last modified:')).toBeInTheDocument();
    expect(screen.getByText(formatDate(ONLINE_PROBE.modified! * 1000))).toBeInTheDocument();
  });
});

// extract this so we can be sure our assertion for it not being there is correct
function getResetButton() {
  return screen.queryByText('Reset Access Token');
}
