import { renderHook, waitFor } from '@testing-library/react';
import { BASIC_PING_CHECK } from 'test/fixtures/checks';
import { TERRAFORM_BASIC_PING_CHECK, TERRAFORM_PRIVATE_PROBES } from 'test/fixtures/terraform';
import { apiRoute } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';

import { Check } from 'types';
import { sanitizeName } from 'components/TerraformConfig/terraformConfigUtils';

import { useTerraformConfig } from './useTerraformConfig';

async function renderTerraformHook(checks: Check[]) {
  server.use(
    apiRoute('listChecks', {
      result: () => {
        return {
          json: checks,
        };
      },
    })
  );

  const { Wrapper } = createWrapper();
  const { result } = renderHook(() => useTerraformConfig(), { wrapper: Wrapper });

  await waitFor(() => {
    expect(result.current.config).not.toBeUndefined();
  });

  expect(result.current.error).toBeFalsy();

  return result;
}

describe('terraform config generation', () => {
  test('handles basic case', async () => {
    const result = await renderTerraformHook([BASIC_PING_CHECK]);

    expect(result.current.checkCommands).toEqual(
      [BASIC_PING_CHECK].map((check) => {
        return `terraform import grafana_synthetic_monitoring_check.${sanitizeName(`${check.job}_${check.target}`)} ${
          check.id
        }`;
      })
    );

    expect(result.current.config).toEqual(TERRAFORM_BASIC_PING_CHECK);
  });

  test('avoids duplicate resource names', async () => {
    const result = await renderTerraformHook([
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
          a_really_really_really_really_really_really_really_really_really_long_jobname_areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample_com:
            {
              enabled: true,
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
            },
          a_really_really_really_really_really_really_really_really_really_long_jobname_areallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylongexample_com_stuff:
            {
              enabled: true,
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
    const result = await renderTerraformHook([
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
                // @ts-expect-error
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
          'stuff_https___www_grafana-dev_com': {
            enabled: true,
            job: 'stuff',
            labels: {},
            probes: [1, 2],
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
});
