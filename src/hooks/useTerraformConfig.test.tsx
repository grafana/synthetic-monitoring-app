import { renderHook, waitFor } from '@testing-library/react';
import { BASIC_PING_CHECK } from 'test/fixtures/checks';
import { SM_DATASOURCE } from 'test/fixtures/datasources';
import { PRIVATE_PROBE, UNSELECTED_PRIVATE_PROBE } from 'test/fixtures/probes';
import { TERRAFORM_BASIC_PING_CHECK, TERRAFORM_PRIVATE_PROBES } from 'test/fixtures/terraform';
import { apiRoute } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';

import { Check, HttpMethod, MultiHttpAssertionType, MultiHttpVariableType, Probe } from 'types';
import { toBase64 } from 'utils';
import { AssertionConditionVariant, AssertionSubjectVariant } from 'components/MultiHttp/MultiHttpTypes';
import { sanitizeName } from 'components/TerraformConfig/terraformConfigUtils';

import { useTerraformConfig } from './useTerraformConfig';

async function renderTerraformHook(checks: Check[], probes: Probe[]) {
  server.use(
    apiRoute('listChecks', {
      result: () => {
        return {
          json: checks,
        };
      },
    }),
    apiRoute('listProbes', {
      result: () => {
        return {
          json: probes,
        };
      },
    })
  );

  const { Wrapper } = createWrapper();
  const { result } = renderHook(() => useTerraformConfig(), { wrapper: Wrapper });

  await waitFor(() => {
    expect(result.current.config).not.toBeUndefined();
  });

  await waitFor(() => {
    expect(result.current.checkCommands.length).toBeGreaterThan(0);
  });

  expect(result.current.error).toBeFalsy();

  return result;
}

describe('terraform config generation', () => {
  test('handles basic check case', async () => {
    const result = await renderTerraformHook([BASIC_PING_CHECK], [PRIVATE_PROBE, UNSELECTED_PRIVATE_PROBE]);

    expect(result.current.checkCommands).toEqual(
      [BASIC_PING_CHECK].map((check) => {
        return `terraform import grafana_synthetic_monitoring_check.${sanitizeName(`${check.job}_${check.target}`)} ${
          check.id
        }`;
      })
    );

    expect(result.current.config).toEqual(TERRAFORM_BASIC_PING_CHECK);
  });

  test('handles basic probe case', async () => {
    const result = await renderTerraformHook([BASIC_PING_CHECK], [PRIVATE_PROBE]);

    expect(result.current.probeCommands).toEqual([
      `terraform import grafana_synthetic_monitoring_probe.${PRIVATE_PROBE.name} ${PRIVATE_PROBE.id}:<PROBE_ACCESS_TOKEN>`,
    ]);
  });

  test('handles several probes case', async () => {
    const result = await renderTerraformHook([BASIC_PING_CHECK], [PRIVATE_PROBE, UNSELECTED_PRIVATE_PROBE]);

    expect(result.current.probeCommands).toEqual([
      `terraform import grafana_synthetic_monitoring_probe.${PRIVATE_PROBE.name} ${PRIVATE_PROBE.id}:<PROBE_ACCESS_TOKEN>`,
      `terraform import grafana_synthetic_monitoring_probe.${UNSELECTED_PRIVATE_PROBE.name} ${UNSELECTED_PRIVATE_PROBE.id}:<PROBE_ACCESS_TOKEN>`,
    ]);
  });

  test('avoids duplicate resource names', async () => {
    const result = await renderTerraformHook(
      [
        {
          ...BASIC_PING_CHECK,
          job: 'a really really really really really really really really really long jobname',
          target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com',
        },
        {
          ...BASIC_PING_CHECK,
          job: 'a really really really really really really really really really long jobname',
          target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com/stuff',
        },
      ],
      [PRIVATE_PROBE, UNSELECTED_PRIVATE_PROBE]
    );

    expect(result.current.config).toEqual({
      provider: {
        grafana: {
          auth: '<GRAFANA_SERVICE_TOKEN>',
          sm_access_token: '<SM_ACCESS_TOKEN>',
          sm_url: SM_DATASOURCE.jsonData.apiHost,
          url: '',
        },
      },
      resource: {
        grafana_synthetic_monitoring_check: {
          a_really_really_really_really_really_really_really_really_really_long_jobname_areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample_com:
            {
              enabled: true,
              frequency: BASIC_PING_CHECK.frequency,
              job: 'a really really really really really really really really really long jobname',
              labels: {
                [BASIC_PING_CHECK.labels[0].name]: BASIC_PING_CHECK.labels[0].value,
              },
              probes: [1, 2],
              settings: {
                ping: {
                  dont_fragment: false,
                  ip_version: 'V4',
                },
              },
              target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com',
              timeout: BASIC_PING_CHECK.timeout,
            },
          a_really_really_really_really_really_really_really_really_really_long_jobname_areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample_com_stuff:
            {
              enabled: true,
              frequency: BASIC_PING_CHECK.frequency,
              job: 'a really really really really really really really really really long jobname',
              labels: {
                [BASIC_PING_CHECK.labels[0].name]: BASIC_PING_CHECK.labels[0].value,
              },
              probes: [1, 2],
              settings: {
                ping: {
                  dont_fragment: false,
                  ip_version: 'V4',
                },
              },
              target: 'areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample.com/stuff',
              timeout: BASIC_PING_CHECK.timeout,
            },
        },
        grafana_synthetic_monitoring_probe: TERRAFORM_PRIVATE_PROBES,
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
    const result = await renderTerraformHook(
      [
        {
          job: 'stuff',
          target: 'https://www.grafana-dev.com',
          enabled: true,
          labels: [],
          probes: [1, 2],
          timeout: 17000,
          frequency: 120000,
          alertSensitivity: 'none',
          settings: {
            multihttp: {
              entries: [
                {
                  request: {
                    method: HttpMethod.GET,
                    url: 'https://www.grafana-dev.com',
                    headers: [],
                    queryFields: [{ name: 'param', value: 'test' }],
                    body: {
                      contentType: 'application/json',
                      contentEncoding: 'base64',
                      payload: toBase64('hi'),
                    },
                  },
                  variables: [],
                  checks: [
                    {
                      type: MultiHttpAssertionType.Text, //0 
                      subject: AssertionSubjectVariant.HttpStatusCode,
                      condition: AssertionConditionVariant.Equals,
                      value: '200',
                    },
                  ],
                },
                {
                  request: {
                    url: 'https://secondrequest.com',
                    body: undefined,
                    method: HttpMethod.POST,
                    headers: [],
                    queryFields: [],
                  },
                  variables: [
                    {
                      type: MultiHttpVariableType.JSON_PATH, //0
                      name: 'avariable',
                      expression: 'great.variable.path',
                    },
                  ],
                  checks: [],
                },
                {
                  request: {
                    url: 'avariable',
                    method: HttpMethod.GET,
                    headers: [],
                    queryFields: [],
                  },
                  variables: [],
                  checks: [],
                },
              ],
            },
          },
          basicMetricsOnly: true,
        },
      ],
      [PRIVATE_PROBE, UNSELECTED_PRIVATE_PROBE]
    );

    expect(result.current.config).toEqual({
      provider: {
        grafana: {
          auth: '<GRAFANA_SERVICE_TOKEN>',
          sm_access_token: '<SM_ACCESS_TOKEN>',
          sm_url: SM_DATASOURCE.jsonData.apiHost,
          url: '',
        },
      },
      resource: {
        grafana_synthetic_monitoring_check: {
          "stuff_https___www_grafana-dev_com": {
            enabled: true,
            frequency: 120000,
            job: 'stuff',
            labels: {},
            probes: [1, 2],
            settings: {
              multihttp: {
                entries: [
                  {
                    request: {
                      method: HttpMethod.GET,
                      url: 'https://www.grafana-dev.com',
                      headers: [],
                      query_fields: [{ name: 'param', value: 'test' }],
                      body: {
                        content_type: 'application/json',
                        content_encoding: 'base64',
                        payload: 'hi',
                      },
                    },
                    variables: [],
                    assertions: [
                      {
                        type: 'TEXT',
                        condition: 'EQUALS',
                        subject: 'HTTP_STATUS_CODE',
                        value: '200',
                      },
                    ],
                  },
                  {
                    request: {
                      url: 'https://secondrequest.com',
                      body: undefined,
                      method: HttpMethod.POST,
                      headers: [],
                      query_fields: [],
                    },
                    variables: [
                      {
                        type: "JSON_PATH",
                        name: 'avariable',
                        expression: 'great.variable.path',
                      },
                    ],
                    assertions: [],
                  },
                  {
                    request: {
                      body: undefined,
                      url: 'avariable',
                      method: HttpMethod.GET,
                      headers: [],
                      query_fields: [],
                    },
                    variables: [],
                    assertions: [],
                  },
                ],
              },
            },
            target: 'https://www.grafana-dev.com',
            timeout: 17000,
          },
        },
        grafana_synthetic_monitoring_probe: TERRAFORM_PRIVATE_PROBES,
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

  test('handles scripted checks', async () => {
    const result = await renderTerraformHook(
      [
        {
          job: 'scripted-test',
          target: 'scripted',
          enabled: true,
          labels: [],
          probes: [1],
          timeout: 17000,
          frequency: 120000,
          alertSensitivity: 'none',
          settings: {
            scripted: {
              script: toBase64('hi'),
            },
          },
          basicMetricsOnly: true,
        },
      ],
      [PRIVATE_PROBE]
    );

    expect(result.current.config).toEqual({
      provider: {
        grafana: {
          auth: '<GRAFANA_SERVICE_TOKEN>',
          sm_access_token: '<SM_ACCESS_TOKEN>',
          sm_url: SM_DATASOURCE.jsonData.apiHost,
          url: '',
        },
      },
      resource: {
        grafana_synthetic_monitoring_check: {
          "scripted-test_scripted": {
            enabled: true,
            frequency: 120000,
            job: 'scripted-test',
            labels: {},
            probes: [1],
            settings: {
              scripted: {
                script: 'hi',
              },
            },
            target: 'scripted',
            timeout: 17000,
          },
        },
        grafana_synthetic_monitoring_probe: {
          [PRIVATE_PROBE.name]: {
            labels: {
              [PRIVATE_PROBE.labels[0].name]: PRIVATE_PROBE.labels[0].value,
              [PRIVATE_PROBE.labels[1].name]: PRIVATE_PROBE.labels[1].value,
            },
            latitude: PRIVATE_PROBE.latitude,
            longitude: PRIVATE_PROBE.longitude,
            name: PRIVATE_PROBE.name,
            public: false,
            region: PRIVATE_PROBE.region,
            disable_browser_checks: PRIVATE_PROBE.capabilities.disableBrowserChecks,
            disable_scripted_checks: PRIVATE_PROBE.capabilities.disableScriptedChecks,
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
