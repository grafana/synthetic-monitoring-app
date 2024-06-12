import React from 'react';
//import { CodeEditor } from '@grafana/ui';
import { screen, waitFor } from '@testing-library/react';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AlertSensitivity, CheckType, HttpMethod, IpVersion, ROUTES } from 'types';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { PLUGIN_URL_PATH } from 'components/constants';

import { fillBasicCheckFields, fillDnsValidationFields, fillTCPQueryResponseFields, submitForm } from './testHelpers';

jest.setTimeout(60000);

// Mock useAlerts hook
const setRulesForCheck = jest.fn();
jest.mock('hooks/useAlerts', () => ({
  useAlerts: () => ({
    alertRules: [],
    setRulesForCheck,
  }),
}));

const renderNewCheckEditor = async (checkType?: CheckType) => {
  const res = render(<CheckForm />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${checkType}`,
  });

  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return res;
};

describe('new checks', () => {
  it('renders the new check form with PING if no checkType is passed in', async () => {
    await renderNewCheckEditor();
    expect(screen.getByText('Add Ping check')).toBeInTheDocument();
  });

  it('renders the new check form with HTTP is checkType is passed in', async () => {
    await renderNewCheckEditor(CheckType.HTTP);
    expect(screen.getByText('Add Http check')).toBeInTheDocument();
  });

  it('has correct sections for HTTP', async () => {
    await renderNewCheckEditor(CheckType.HTTP);
    const httpSettings = await screen.findByText('HTTP settings');
    expect(httpSettings).toBeInTheDocument();
    const tlsConfig = await screen.findByText('TLS config');
    expect(tlsConfig).toBeInTheDocument();
    const authentication = await screen.findByText('Authentication');
    expect(authentication).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advanced = await screen.findByText('Advanced options');
    expect(advanced).toBeInTheDocument();
  });

  it('has correct sections for DNS', async () => {
    await renderNewCheckEditor(CheckType.DNS);
    const dnsSettings = await screen.findByText('DNS settings');
    expect(dnsSettings).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced options');
    expect(advancedOptions).toBeInTheDocument();
  });

  it('has correct sections for TCP', async () => {
    await renderNewCheckEditor(CheckType.TCP);
    const dnsSettings = await screen.findByText('TCP settings');
    expect(dnsSettings).toBeInTheDocument();
    const query = await screen.findAllByText('Query/Response');
    expect(query[0]).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced options');
    expect(advancedOptions).toBeInTheDocument();
  });

  const name = 'Job name';
  const labels = [{ name: 'foo', value: 'bar' }];

  it('can create a new HTTP check', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));
    const { user } = await renderNewCheckEditor(CheckType.HTTP);
    const url = 'https://grafana.com';

    await fillBasicCheckFields(name, url, user, labels);
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      probes: [PRIVATE_PROBE.id],
      job: name,
      target: url,
      labels,
      alertSensitivity: AlertSensitivity.None,
      enabled: true,
      frequency: 60000,
      timeout: 3000,
      basicMetricsOnly: true,
      settings: {
        http: {
          method: HttpMethod.GET,
          ipVersion: IpVersion.V4,
          noFollowRedirects: false,
          validStatusCodes: [],
          validHTTPVersions: [],
          headers: [],
          proxyConnectHeaders: [],
          body: '',
          proxyURL: '',
          cacheBustingQueryParamName: '',
          compression: ``,
          failIfNotSSL: false,
          failIfSSL: false,
          failIfBodyMatchesRegexp: [],
          failIfBodyNotMatchesRegexp: [],
          failIfHeaderMatchesRegexp: [],
          failIfHeaderNotMatchesRegexp: [],
          tlsConfig: {
            clientCert: '',
            caCert: '',
            clientKey: '',
            insecureSkipVerify: false,
            serverName: '',
          },
        },
      },
    });
  });

  it('can create a new PING check', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));
    const { user } = await renderNewCheckEditor(CheckType.PING);
    const url = 'grafana.com';

    await fillBasicCheckFields(name, url, user, labels);
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      probes: [PRIVATE_PROBE.id],
      job: name,
      target: url,
      labels,
      alertSensitivity: AlertSensitivity.None,
      enabled: true,
      frequency: 60000,
      timeout: 3000,
      basicMetricsOnly: true,
      settings: {
        ping: {
          dontFragment: false,
          ipVersion: IpVersion.V4,
        },
      },
    });
  });

  it('can create a new TCP check', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = await renderNewCheckEditor(CheckType.TCP);
    const url = 'grafana.com:43';

    await fillBasicCheckFields(name, url, user, labels);
    await fillTCPQueryResponseFields(user);
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      probes: [PRIVATE_PROBE.id],
      job: name,
      target: url,
      labels,
      alertSensitivity: AlertSensitivity.None,
      enabled: true,
      frequency: 60000,
      timeout: 3000,
      basicMetricsOnly: true,
      settings: {
        tcp: {
          queryResponse: [
            {
              expect: `U1RBUlRUTFM=`,
              send: 'UVVJVA==',
              startTLS: false,
            },
          ],
          ipVersion: IpVersion.V4,
          tls: false,
          tlsConfig: {
            caCert: '',
            clientCert: '',
            clientKey: '',
            insecureSkipVerify: false,
            serverName: '',
          },
        },
      },
    });
  });

  it('can create a new DNS check', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const { user } = await renderNewCheckEditor(CheckType.DNS);
    const url = 'grafana.com';

    await fillBasicCheckFields(name, url, user, labels);
    await fillDnsValidationFields(user);

    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      probes: [PRIVATE_PROBE.id],
      job: name,
      target: url,
      labels,
      alertSensitivity: AlertSensitivity.None,
      enabled: true,
      frequency: 60000,
      timeout: 3000,
      basicMetricsOnly: true,
      settings: {
        dns: {
          ipVersion: 'V4',
          port: 53,
          protocol: 'UDP',
          recordType: 'A',
          server: 'dns.google',
          validRCodes: ['NOERROR'],
          validateAdditionalRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
          validateAnswerRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
          validateAuthorityRRS: {
            failIfMatchesRegexp: ['inverted validation'],
            failIfNotMatchesRegexp: ['not inverted validation'],
          },
        },
      },
    });
  });

  describe(`over limits`, () => {
    it(`shows error alert when check limit is reached`, async () => {
      server.use(
        apiRoute('getTenantLimits', {
          result: () => ({
            json: {
              MaxChecks: 1,
              MaxScriptedChecks: 10,
            },
          }),
        })
      );
      render(<CheckForm />, {
        route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
        path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/http`,
      });

      const errorAlert = await screen.findByText(/Maximum number of checks reached/, { exact: false });
      expect(errorAlert).toBeInTheDocument();
      const submitButton = await screen.findByRole('button', { name: 'Save' });
      expect(submitButton).toBeDisabled();
    });

    it(`shows error alert when scripted check limit is reached`, async () => {
      server.use(
        apiRoute('getTenantLimits', {
          result: () => ({
            json: {
              MaxChecks: 10,
              MaxScriptedChecks: 1,
            },
          }),
        })
      );
      render(<CheckForm />, {
        route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
        path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/scripted`,
      });

      const errorAlert = await screen.findByText(/Maximum number of scripted checks reached/, { exact: false });
      expect(errorAlert).toBeInTheDocument();
      const submitButton = await screen.findByRole('button', { name: 'Save' });
      expect(submitButton).toBeDisabled();
    });
  });
});
