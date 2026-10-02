import React from 'react';
import { locationService } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { decode } from 'js-base64';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import { ONLINE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';
import { ONE_HOUR_IN_MS } from 'utils.constants';

import { BrokenLinksDrawer } from './BrokenLinksDrawer';

beforeEach(() => {
  mockFeatureToggles({ [FeatureName.Folders]: false });
  server.use(
    apiRoute('listProbes', { result: () => ({ json: [ONLINE_PROBE] }) }),
    apiRoute('addCheck', {
      result: async (req) => ({
        json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123, created: 1700000000 },
      }),
    })
  );
});

async function openDrawer() {
  const onClose = jest.fn();
  const result = render(<BrokenLinksDrawer onClose={onClose} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create check' })).toBeEnabled());
  return { ...result, onClose };
}

it('creates an hourly check directly with library options and an online probe', async () => {
  const reportInteraction = jest.spyOn(jest.requireMock('@grafana/runtime'), 'reportInteraction');
  const { record, read } = getServerRequests();
  server.use(
    apiRoute(
      'addCheck',
      { result: async (req) => ({ json: { ...COMPLEX_BROWSER_CHECK, ...(await req.json()), id: 123 } }) },
      record
    )
  );
  const { user, onClose } = await openDrawer();
  expect(screen.getByRole('textbox', { name: /^Page URL/ })).toBeRequired();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.tab();
  expect(screen.queryByRole('textbox', { name: 'Check name' })).not.toBeInTheDocument();
  const maxLinks = screen.getByRole('spinbutton', { name: /^Link limit/ });
  await user.clear(maxLinks);
  await user.type(maxLinks, '25');
  const timeout = screen.getByRole('spinbutton', { name: /^Timeout/ });
  await user.clear(timeout);
  await user.type(timeout, '5');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  const { body } = await read();
  expect(body).toMatchObject({
    job: 'Detect broken links on https://grafana.com/',
    target: 'https://grafana.com/',
    frequency: ONE_HOUR_IN_MS,
    probes: [ONLINE_PROBE.id],
    enabled: true,
  });
  const script = decode(body.settings.browser.script);
  expect(script).toContain('"maxLinks": 25');
  expect(script).toContain('"timeout": "5s"');
  expect(script).not.toContain('validStatuses');
  expect(script).not.toContain('failOnBroken');
  expect(locationService.getLocation().pathname).toContain('/checks/123');
  expect(reportInteraction).toHaveBeenCalledWith(
    'synthetic-monitoring_check_form_check_created',
    expect.objectContaining({ check_template_id: 'broken_links' })
  );
});

it('validates inputs before sending a check', async () => {
  const { record, requests } = getServerRequests();
  server.use(apiRoute('addCheck', {}, record));
  const { user } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'ftp://example.com');
  const maximum = screen.getByRole('spinbutton', { name: /^Link limit/ });
  await user.clear(maximum);
  await user.type(maximum, '0');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Enter a valid URL starting with https:// or http://.')).toBeInTheDocument();
  expect(screen.getByText('Enter a positive whole number.')).toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

it('preserves inputs on API failure and allows retry', async () => {
  server.use(apiRoute('addCheck', { result: () => ({ status: 500, json: { err: 'Creation failed' } }) }));
  const { user, onClose } = await openDrawer();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.tab();
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  expect(await screen.findByText('Unable to create check')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Check name' })).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  server.use(apiRoute('addCheck', { result: () => ({ json: COMPLEX_BROWSER_CHECK }) }));
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it('blocks creation when there are no compatible probes', async () => {
  server.use(
    apiRoute('listProbes', {
      result: () => ({
        json: [{ ...ONLINE_PROBE, capabilities: { ...ONLINE_PROBE.capabilities, disableBrowserChecks: true } }],
      }),
    })
  );
  render(<BrokenLinksDrawer onClose={jest.fn()} />);
  expect(await screen.findByText('No compatible probe available')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create check' })).toBeDisabled();
});

it('uses library defaults when optional settings are empty and preselects a probe without a selector', async () => {
  const { record, read } = getServerRequests();
  server.use(apiRoute('addCheck', { result: () => ({ json: COMPLEX_BROWSER_CHECK }) }, record));
  const { user, onClose } = await openDrawer();
  expect(screen.queryByRole('combobox', { name: 'Probe' })).not.toBeInTheDocument();
  expect(screen.queryByRole('switch', { name: 'Fail on broken links' })).not.toBeInTheDocument();
  expect(screen.getByRole('spinbutton', { name: /^Link limit/ })).toHaveValue(null);
  expect(screen.getByRole('spinbutton', { name: /^Timeout/ })).toHaveValue(null);
  expect(screen.getByText('Check a page for broken links on a regular schedule.')).toBeInTheDocument();
  expect(screen.getByText('Creates a browser check. You can manually edit it afterward.')).toBeInTheDocument();
  expect(screen.queryByText('Accepted status codes')).not.toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: /^Page URL/ }), 'https://grafana.com');
  await user.click(screen.getByRole('button', { name: 'Create check' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  const { body } = await read();
  expect(body.probes).toEqual([ONLINE_PROBE.id]);
  expect(decode(body.settings.browser.script)).toContain('await checkLinks(page, {});');
});

it('generates a valid name from the latest URL on submit without requiring blur', async () => {
  const { record, read } = getServerRequests();
  server.use(apiRoute('addCheck', { result: () => ({ json: COMPLEX_BROWSER_CHECK }) }, record));
  const { user, onClose } = await openDrawer();
  const url = screen.getByRole('textbox', { name: /^Page URL/ });
  await user.type(url, 'https://grafana.com');
  await user.clear(url);
  await user.type(url, 'https://example.com/path?q=a,b' + 'x'.repeat(150));
  await user.keyboard('{Enter}');
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  const { body } = await read();
  expect(body.job).toMatch(/^Detect broken links on https:\/\/example.com\/path\?q=a%2Cb/);
  expect(body.job.length).toBeLessThanOrEqual(128);
  expect(body.target).toBe('https://example.com/path?q=a,b' + 'x'.repeat(150));
});
