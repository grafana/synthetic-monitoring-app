import React, { PropsWithChildren } from 'react';
import { AppPluginMeta } from '@grafana/data';
import { renderHook, waitFor } from '@testing-library/react';

import { GlobalSettings } from 'types';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';

import { useTerraformConfig } from './useTerraformConfig';

describe('terraform config generation', () => {
  test('handles basic case', async () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      const api = getInstanceMock();
      const instance = {
        api,
      };
      const meta = {} as AppPluginMeta<GlobalSettings>;

      return <InstanceContext.Provider value={{ instance, loading: false, meta }}>{children}</InstanceContext.Provider>;
    };
    const { result } = renderHook(() => useTerraformConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.config).not.toBeUndefined();
    });

    expect(result.current.error).toBeFalsy();

    expect(result.current.checkCommands).toEqual([
      'terraform import grafana_synthetic_monitoring_check.a_jobname_example_com 1',
    ]);

    expect(result.current.config).toEqual({
      provider: {
        grafana: {
          auth: '<add an api key from grafana.com>',
          sm_access_token: '<add an sm access token>',
          sm_url: 'http://localhost:4030',
          url: '',
        },
      },
      resource: {
        grafana_synthetic_monitoring_check: {
          a_jobname_example_com: {
            enabled: true,
            job: 'a jobname',
            labels: {},
            probes: [1],
            settings: {
              ping: {
                dont_fragment: false,
                ip_version: 'V4',
              },
            },
            target: 'example.com',
          },
        },
        grafana_synthetic_monitoring_probe: {
          tacos: {
            labels: {
              Mr: 'Orange',
            },
            latitude: 0,
            longitude: 0,
            name: 'tacos',
            public: false,
            region: 'EMEA',
          },
        },
      },
      terraform: {
        required_providers: {
          grafana: {
            source: 'grafana/grafana',
          },
        },
      },
    });
  });

  test('avoids duplicate resource names', async () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      const api = getInstanceMock();
      api.listChecks = jest.fn().mockImplementation(() =>
        Promise.resolve([
          {
            job: 'a really really really really really really really really really long jobname',
            id: 1,
            target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com',
            frequency: 60000,
            timeout: 3000,
            enabled: true,
            labels: [],
            probes: [1],
            settings: {
              ping: {
                ipVersion: 'V4',
                dontFragment: false,
              },
            },
          },
          {
            job: 'a really really really really really really really really really long jobname',
            id: 1,
            target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com/stuff',
            frequency: 60000,
            timeout: 3000,
            enabled: true,
            labels: [],
            probes: [1],
            settings: {
              ping: {
                ipVersion: 'V4',
                dontFragment: false,
              },
            },
          },
        ])
      );
      const instance = {
        api,
      };
      const meta = {} as AppPluginMeta<GlobalSettings>;

      return <InstanceContext.Provider value={{ instance, loading: false, meta }}>{children}</InstanceContext.Provider>;
    };
    const { result } = renderHook(() => useTerraformConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.config).not.toBeUndefined();
    });

    expect(result.current.error).toBeFalsy();
    expect(result.current.config).toEqual({
      provider: {
        grafana: {
          auth: '<add an api key from grafana.com>',
          sm_access_token: '<add an sm access token>',
          sm_url: 'http://localhost:4030',
          url: '',
        },
      },
      resource: {
        grafana_synthetic_monitoring_check: {
          a_really_really_really_really_really_really_really_really_really_long_jobname_areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample_com:
            {
              enabled: true,
              job: 'a really really really really really really really really really long jobname',
              labels: {},
              probes: [1],
              settings: {
                ping: {
                  dont_fragment: false,
                  ip_version: 'V4',
                },
              },
              target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com',
            },
          a_really_really_really_really_really_really_really_really_really_long_jobname_areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample_com_stuff:
            {
              enabled: true,
              job: 'a really really really really really really really really really long jobname',
              labels: {},
              probes: [1],
              settings: {
                ping: {
                  dont_fragment: false,
                  ip_version: 'V4',
                },
              },
              target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com/stuff',
            },
        },
        grafana_synthetic_monitoring_probe: {
          tacos: {
            labels: {
              Mr: 'Orange',
            },
            latitude: 0,
            longitude: 0,
            name: 'tacos',
            public: false,
            region: 'EMEA',
          },
        },
      },
      terraform: {
        required_providers: {
          grafana: {
            source: 'grafana/grafana',
          },
        },
      },
    });
  });

  test('handles multihttp checks', async () => {
    const wrapper = ({ children }: PropsWithChildren<{}>) => {
      const api = getInstanceMock();
      api.listChecks = jest.fn().mockImplementation(() =>
        Promise.resolve([
          {
            job: 'stuff',
            target: 'https://www.grafana-dev.com',
            enabled: true,
            labels: [],
            probes: [57],
            timeout: 17000,
            frequency: 120000,
            alertSensitivity: 'none',
            settings: {
              multihttp: {
                entries: [
                  {
                    request: { method: 'GET', url: 'https://www.grafana-dev.com', headers: [], queryFields: [{}] },
                    variables: [],
                    checks: [{ type: 0, subject: 2, condition: 2, value: '200' }],
                  },
                  {
                    request: { url: 'https://secondrequest.com', method: 'POST', headers: [], queryFields: [] },
                    variables: [{ type: 0, name: 'avariable', expression: 'great.variable.path' }],
                    checks: [],
                  },
                  {
                    request: { url: '${avariable}', method: 'GET', headers: [], queryFields: [] },
                    variables: [],
                    checks: [],
                  },
                ],
              },
            },
            basicMetricsOnly: true,
          },
        ])
      );
      const instance = {
        api,
      };
      const meta = {} as AppPluginMeta<GlobalSettings>;

      return <InstanceContext.Provider value={{ instance, loading: false, meta }}>{children}</InstanceContext.Provider>;
    };
    const { result } = renderHook(() => useTerraformConfig(), { wrapper });
    await waitFor(() => {
      expect(result.current.config).not.toBeUndefined();
    });
    expect(result.current.config).toEqual({
      provider: {
        grafana: {
          auth: '<add an api key from grafana.com>',
          sm_access_token: '<add an sm access token>',
          sm_url: 'http://localhost:4030',
          url: '',
        },
      },
      resource: {
        grafana_synthetic_monitoring_check: {
          'stuff_https___www_grafana-dev_com': {
            enabled: true,
            job: 'stuff',
            labels: {},
            probes: [57],
            settings: {
              multihttp: {
                entries: [
                  {
                    checks: [
                      {
                        condition: 2,
                        subject: 2,
                        type: 0,
                        value: '200',
                      },
                    ],
                    request: {
                      body: {
                        content_type: undefined,
                      },
                      headers: [],
                      method: 'GET',
                      query_fields: [{}],
                      url: 'https://www.grafana-dev.com',
                    },
                    variables: [],
                  },
                  {
                    checks: [],
                    request: {
                      body: {
                        content_type: undefined,
                      },
                      headers: [],
                      method: 'POST',
                      query_fields: [],
                      url: 'https://secondrequest.com',
                    },
                    variables: [
                      {
                        expression: 'great.variable.path',
                        name: 'avariable',
                        type: 0,
                      },
                    ],
                  },
                  {
                    checks: [],
                    request: {
                      body: {
                        content_type: undefined,
                      },
                      headers: [],
                      method: 'GET',
                      query_fields: [],
                      // We need double dollar signs here because of terraform interpolation
                      url: '$${avariable}',
                    },
                    variables: [],
                  },
                ],
              },
            },
            target: 'https://www.grafana-dev.com',
          },
        },
        grafana_synthetic_monitoring_probe: {
          tacos: {
            labels: {
              Mr: 'Orange',
            },
            latitude: 0,
            longitude: 0,
            name: 'tacos',
            public: false,
            region: 'EMEA',
          },
        },
      },
      terraform: {
        required_providers: {
          grafana: {
            source: 'grafana/grafana',
          },
        },
      },
    });
  });
});
