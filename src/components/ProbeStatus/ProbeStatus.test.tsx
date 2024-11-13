import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { OFFLINE_PROBE, ONLINE_PROBE, PRIVATE_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';
import { probeToExtendedProbe, runTestAsRbacReader, runTestAsViewer } from 'test/utils';

import { formatDate } from 'utils';

import { ProbeStatus } from './ProbeStatus';

it(`hides the reset button when the user is a viewer`, async () => {
  runTestAsViewer();
  // We need to wait for contexts to finish loading to avoid issue with act
  await waitFor(() => render(<ProbeStatus probe={probeToExtendedProbe(PRIVATE_PROBE)} onReset={jest.fn()} />));
  const resetButton = await getResetButton(true);
  expect(resetButton).not.toBeInTheDocument();
});

it(`hides the reset button when the user is a RBAC viewer`, async () => {
  runTestAsRbacReader();
  // We need to wait for contexts to finish loading to avoid issue with act
  await waitFor(() => render(<ProbeStatus probe={probeToExtendedProbe(PRIVATE_PROBE)} onReset={jest.fn()} />));
  const resetButton = await getResetButton(true);
  expect(resetButton).not.toBeInTheDocument();
});

it(`shows the reset probe access token when the user is an editor`, async () => {
  render(<ProbeStatus probe={probeToExtendedProbe(PRIVATE_PROBE)} onReset={jest.fn()} />);
  const resetButton = await getResetButton();
  expect(resetButton).toBeInTheDocument();
});

describe(`Last on/offline display`, () => {
  it(`displays last online: 'never' correctly`, async () => {
    const neverOnline = {
      ...OFFLINE_PROBE,
      onlineChange: OFFLINE_PROBE.created!,
    };

    render(<ProbeStatus probe={probeToExtendedProbe(neverOnline)} onReset={jest.fn()} />);
    expect(await screen.findByText('Last online:')).toBeInTheDocument();
    expect(await screen.findByText('Never')).toBeInTheDocument();
  });

  it(`displays last online correctly`, async () => {
    render(<ProbeStatus probe={probeToExtendedProbe(OFFLINE_PROBE)} onReset={jest.fn()} />);
    expect(await screen.findByText('Last online:')).toBeInTheDocument();
    expect(await screen.findByText(formatDate(OFFLINE_PROBE.onlineChange * 1000))).toBeInTheDocument();
  });

  it(`displays last offline correctly`, async () => {
    render(<ProbeStatus probe={probeToExtendedProbe(ONLINE_PROBE)} onReset={jest.fn()} />);
    expect(await screen.findByText('Last offline:')).toBeInTheDocument();
    expect(await screen.findByText(formatDate(ONLINE_PROBE.onlineChange * 1000))).toBeInTheDocument();
  });
});

describe(`Last modified display`, () => {
  it(`displays last modified: 'never' correctly`, async () => {
    const neverModified = {
      ...OFFLINE_PROBE,
      modified: OFFLINE_PROBE.created,
    };

    render(<ProbeStatus probe={probeToExtendedProbe(neverModified)} onReset={jest.fn()} />);
    expect(await screen.findByText('Last modified:')).toBeInTheDocument();
    expect(await screen.findByText('Never')).toBeInTheDocument();
  });

  it(`displays last modified correctly`, async () => {
    render(<ProbeStatus probe={probeToExtendedProbe(ONLINE_PROBE)} onReset={jest.fn()} />);
    expect(await screen.findByText('Last modified:')).toBeInTheDocument();
    expect(await screen.findByText(formatDate(ONLINE_PROBE.modified! * 1000))).toBeInTheDocument();
  });
});

// extract this so we can be sure our assertion for it not being there is correct
function getResetButton(expectFailure = false) {
  const text = 'Reset Access Token';
  if (expectFailure) {
    return screen.queryByText(text);
  }
  return screen.findByText(text);
}
