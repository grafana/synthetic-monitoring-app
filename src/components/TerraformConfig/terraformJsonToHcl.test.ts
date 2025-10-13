import { HttpMethod } from '../../types';

import { jsonToHcl } from './terraformJsonToHcl';
import { TFConfig } from './terraformTypes';

describe('terraformJsonToHcl', () => {
  const baseConfig: Pick<TFConfig, 'terraform' | 'provider'> = {
    terraform: {
      required_providers: {
        grafana: {
          source: 'grafana/grafana',
        },
      },
    },
    provider: {
      grafana: {
        url: 'http://localhost:3000',
        auth: '<GRAFANA_SERVICE_TOKEN>',
        sm_url: 'http://localhost:4000',
        sm_access_token: '<SM_ACCESS_TOKEN>',
      },
    },
  };

  const createConfig = (resource: TFConfig['resource']): TFConfig => ({
    ...baseConfig,
    resource,
  });

  const expectHclToContain = (hcl: string, expectations: string[]) => {
    expectations.forEach(expectation => {
      expect(hcl).toContain(expectation);
    });
  };

  const expectHclNotToContain = (hcl: string, expectations: string[]) => {
    expectations.forEach(expectation => {
      expect(hcl).not.toContain(expectation);
    });
  };

  describe('jsonToHcl', () => {
    it('should convert basic TFConfig to HCL format', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check: {
          test_check: {
            job: 'test-job',
            target: 'https://example.com',
            enabled: true,
            probes: [1, 2],
            labels: {
              environment: 'test',
              team: 'platform',
            },
            settings: {
              http: {
                method: HttpMethod.GET,
                ip_version: 'V4',
              },
            },
            frequency: 60000,
            timeout: 3000,
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        // Terraform block
        'terraform {',
        'required_providers {',
        'source = "grafana/grafana"',
        // Provider block
        'provider "grafana" {',
        'url = "http://localhost:3000"',
        'auth = "<GRAFANA_SERVICE_TOKEN>"',
        // Resource block
        'resource "grafana_synthetic_monitoring_check" "test_check" {',
        'job = "test-job"',
        'target = "https://example.com"',
        'enabled = true',
        'probes = [',
        '1,',
        '2',
        // Labels
        'labels = {',
        'environment = "test"',
        'team = "platform"',
        // Settings
        'settings {',
        'http {',
        'method = "GET"',
      ]);
    });

    it('should handle multi-line scripts with heredoc syntax', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check: {
          browser_check: {
            job: 'browser-test',
            target: 'https://example.com',
            enabled: true,
            probes: [1],
            labels: {},
            settings: {
              browser: {
                script: 'import { browser } from \'k6/browser\';\nimport { check } from \'k6\';\n\nexport default async function () {\n  const page = await browser.newPage();\n  await page.goto(`https://${BASE_URL}`);\n  console.log(`Found ${productCards.length} items`);\n  await page.close();\n}',
              },
            },
            frequency: 60000,
            timeout: 30000,
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        'script = <<EOF',
        'import { browser }',
        'EOF',
        // Should escape Terraform interpolation syntax
        '`https://$${BASE_URL}`',
        'Found $${productCards.length} items',
      ]);

      expectHclNotToContain(hcl, [
        'script = "import',
      ]);
    });

    it('should handle MultiHTTP checks with headers and body as blocks', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check: {
          multihttp_test: {
            job: 'multihttp-test',
            target: 'https://example.com',
            enabled: true,
            probes: [1],
            labels: {},
            settings: {
              multihttp: {
                entries: [
                  {
                    request: {
                      method: HttpMethod.POST,
                      url: 'https://example.com/api',
                      headers: [
                        {
                          name: 'Content-Type',
                          value: 'application/json'
                        },
                        {
                          name: 'Authorization',
                          value: 'Bearer token123'
                        }
                      ],
                      body: {
                        content_type: 'application/json',
                        payload: '{"test": true}'
                      },
                      query_fields: [
                        {
                          name: 'param1',
                          value: 'value1'
                        },
                        {
                          name: 'param2', 
                          value: 'value2'
                        }
                      ]
                    },
                    assertions: [
                      {
                        type: 'TEXT',
                        condition: 'CONTAINS',
                        subject: 'RESPONSE_BODY',
                        value: 'success'
                      }
                    ]
                  }
                ]
              }
            },
            frequency: 60000,
            timeout: 30000,
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        // MultiHTTP structure
        'resource "grafana_synthetic_monitoring_check" "multihttp_test"',
        'multihttp {',
        'entries {',
        'request {',
        // Headers as blocks in MultiHTTP context
        'headers {',
        'name = "Content-Type"',
        'value = "application/json"',
        'name = "Authorization"',
        'value = "Bearer token123"',
        // Body as block in MultiHTTP context
        'body {',
        'content_type = "application/json"',
        'payload = "{\\"test\\": true}"',
        // Query fields as blocks in MultiHTTP context
        'query_fields {',
        'name = "param1"',
        'value = "value1"',
        'name = "param2"',
        'value = "value2"',
        // Assertions
        'assertions {',
        'type = "TEXT"',
      ]);
    });

    it('should handle regular HTTP checks with headers as arguments', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check: {
          http_test: {
            job: 'http-test',
            target: 'https://grafana.com',
            enabled: true,
            probes: [12],
            labels: {},
            settings: {
              http: {
                method: HttpMethod.GET,
                headers: [
                  'Content-Type: application/json',
                  'User-Agent: synthetic-monitoring'
                ],
                fail_if_not_ssl: false,
                fail_if_ssl: false,
                ip_version: 'V4',
                no_follow_redirects: false
              }
            },
            frequency: 30000,
            timeout: 14000,
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        'resource "grafana_synthetic_monitoring_check" "http_test"',
        'http {',
        'method = "GET"',
        // Headers as array in HTTP context
        'headers = [',
        '"Content-Type: application/json"',
        '"User-Agent: synthetic-monitoring"',
        // Other expected fields
        'fail_if_not_ssl = false',
        'ip_version = "V4"',
      ]);
    });

    it('should handle probe resources', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_probe: {
          test_probe: {
            name: 'test-probe',
            latitude: 40.7128,
            longitude: -74.0060,
            region: 'us-east-1',
            public: false,
            labels: {
              environment: 'test',
            },
            disable_scripted_checks: false,
            disable_browser_checks: false,
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        'resource "grafana_synthetic_monitoring_probe" "test_probe" {',
        'name = "test-probe"',
        'latitude = 40.7128',
        'longitude = -74.006',
        'region = "us-east-1"',
        'public = false',
        'disable_scripted_checks = false',
        'disable_browser_checks = false',
      ]);
    });

    it('should handle check alerts', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check_alerts: {
          test_alerts: {
            check_id: '123',
            alerts: [
              {
                name: 'Test Alert',
                threshold: 0.9,
                period: '5m',
                runbook_url: 'https://example.com/runbook',
              },
              {
                name: 'Another Alert',
                threshold: 0.8,
                period: '10m',
                runbook_url: '',
              }
            ],
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        'resource "grafana_synthetic_monitoring_check_alerts" "test_alerts" {',
        'check_id = "123"',
        'alerts {',
        'name = "Test Alert"',
        'threshold = 0.9',
        'period = "5m"',
        'runbook_url = "https://example.com/runbook"',
        'name = "Another Alert"',
        'threshold = 0.8',
      ]);
    });

    it('should handle block fields correctly and skip empty objects', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check: {
          test_blocks: {
            job: 'test-blocks',
            target: 'https://example.com',
            enabled: true,
            probes: [1],
            labels: {},
            settings: {
              http: {
                method: HttpMethod.GET,
                ip_version: 'V4',
                tls_config: {}, // Empty object - should not be rendered
                basic_auth: {
                  username: 'user',
                  password: 'pass'
                }, // Non-empty object - should be rendered as block
                body: '{"test": true}' // Should be rendered as string argument
              },
            },
            frequency: 60000,
            timeout: 3000,
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        'basic_auth {',
        'username = "user"',
        'password = "pass"',
        'body = "{\\"test\\": true}"',
      ]);

      expectHclNotToContain(hcl, [
        'tls_config',
      ]);
    });

    it('should handle string escaping correctly', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check: {
          escape_test: {
            job: 'escape-test',
            target: 'https://example.com',
            enabled: true,
            probes: [1],
            labels: {
              'special-chars': 'quotes"and\\backslashes\nand\ttabs\rand${template}',
            },
            settings: {
              http: {
                method: HttpMethod.GET,
                ip_version: 'V4',
                body: 'JSON with "quotes" and \\ backslashes\nand\ttabs'
              },
            },
            frequency: 60000,
            timeout: 3000,
          },
        },
      });

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        'special-chars = <<EOF',
        'and$${template}',
        'body = <<EOF',
      ]);
    });

    it('should handle empty resources', () => {
      const config = createConfig({});

      const hcl = jsonToHcl(config);

      expectHclToContain(hcl, [
        'terraform {',
        'provider "grafana" {',
      ]);

      expectHclNotToContain(hcl, [
        'resource "grafana_synthetic_monitoring_check"',
      ]);
    });

    it('should add newlines between resources for better readability', () => {
      const config = createConfig({
        grafana_synthetic_monitoring_check: {
          first_check: {
            job: 'first-job',
            target: 'https://first.com',
            enabled: true,
            probes: [1],
            labels: {},
            settings: {
              http: {
                method: HttpMethod.GET,
                ip_version: 'V4',
              },
            },
            frequency: 60000,
            timeout: 3000,
          },
          second_check: {
            job: 'second-job',
            target: 'https://second.com',
            enabled: true,
            probes: [2],
            labels: {},
            settings: {
              http: {
                method: HttpMethod.POST,
                ip_version: 'V4',
              },
            },
            frequency: 30000,
            timeout: 5000,
          },
        },
      });

      const hcl = jsonToHcl(config);

      // Check that resources are separated by newlines - should have pattern: }\n\nresource
      expect(hcl).toMatch(/}\s*\n\s*\nresource "grafana_synthetic_monitoring_check" "second_check"/);
    });
  });
});
