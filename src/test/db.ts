import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import {
  AlertSensitivity,
  Check,
  CheckAlertPublished,
  CheckAlertType,
  CheckType,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpVersion,
  IpVersion,
  Probe,
} from 'types';

const baseCheckModel = ({ sequence }: { sequence: number }) => ({
  id: sequence,
  job: faker.lorem.word(),
  target: faker.internet.domainName(),
  frequency: faker.number.int({ min: 1, max: 60 * 1000 }),
  timeout: faker.number.int({ min: 30, max: 60 * 1000 }),
  enabled: true,
  alertSensitivity: faker.helpers.arrayElement(Object.values(AlertSensitivity)),
  alerts: [],
  basicMetricsOnly: faker.datatype.boolean(),
  labels: [{ name: faker.animal.petName(), value: faker.color.human() }],
  probes: [],
  modified: Math.floor(faker.date.recent().getTime() / 1000),
  created: Math.floor(faker.date.past().getTime() / 1000),
});

const baseProbeModel = ({ sequence }: { sequence: number }) => ({
  id: sequence,
  name: `${faker.lorem.word()}_${sequence}`,
  public: faker.datatype.boolean(),
  latitude: faker.location.latitude(),
  longitude: faker.location.longitude(),
  region: faker.helpers.arrayElement(['EMEA', 'AMER', 'APAC']),
  labels: [{ name: faker.animal.petName(), value: faker.color.human() }],
  online: true,
  onlineChange: Math.floor(faker.date.past().getTime() / 1000),
  version: faker.system.semver(),
  deprecated: false,
  modified: Math.floor(faker.date.recent().getTime() / 1000),
  created: Math.floor(faker.date.past().getTime() / 1000),
  capabilities: {
    disableScriptedChecks: false,
    disableBrowserChecks: false,
  },
});

const tlsConfig = () => ({
  caCert: faker.helpers.maybe(() => faker.string.uuid()),
  clientCert: faker.helpers.maybe(() => faker.string.uuid()),
  clientKey: faker.helpers.maybe(() => faker.string.uuid()),
  insecureSkipVerify: faker.helpers.maybe(() => faker.datatype.boolean()),
  serverName: faker.helpers.maybe(() => faker.lorem.word()),
});

type CheckTransientParams = {
  type: CheckType;
};

export const db = {
  check: Factory.define<Check, CheckTransientParams>(({ transientParams, sequence }) => {
    const { type } = transientParams;

    switch (type) {
      case CheckType.HTTP: {
        return {
          ...baseCheckModel({ sequence }),
          target: faker.internet.url(),
          settings: {
            http: {
              method: faker.helpers.arrayElement(Object.values(HttpMethod)),
              headers: faker.helpers.maybe(() => []),
              body: faker.helpers.maybe(() => faker.lorem.text()),
              ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
              noFollowRedirects: faker.datatype.boolean(),
              tlsConfig: faker.helpers.maybe(() => tlsConfig()),
              compression: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(HTTPCompressionAlgo))),
              proxyURL: faker.helpers.maybe(() => faker.internet.url()),
              proxyConnectHeaders: faker.helpers.maybe(() => []),
              bearerToken: faker.helpers.maybe(() => faker.lorem.word()),
              basicAuth: faker.helpers.maybe(() => ({
                username: faker.internet.username(),
                password: faker.internet.password(),
              })),
              failIfSSL: faker.helpers.maybe(() => faker.datatype.boolean()),
              failIfNotSSL: faker.helpers.maybe(() => faker.datatype.boolean()),
              validStatusCodes: faker.helpers.maybe(() => []),
              validHTTPVersions: faker.helpers.maybe(() => faker.helpers.arrayElements(Object.values(HttpVersion))),
              failIfBodyMatchesRegexp: faker.helpers.maybe(() => []),
              failIfBodyNotMatchesRegexp: faker.helpers.maybe(() => []),
              failIfHeaderMatchesRegexp: faker.helpers.maybe(() => []),
              failIfHeaderNotMatchesRegexp: faker.helpers.maybe(() => []),
              cacheBustingQueryParamName: faker.helpers.maybe(() => faker.lorem.word()),
            },
          },
        };
      }

      case CheckType.PING: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            ping: {
              ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
              dontFragment: faker.datatype.boolean(),
            },
          },
        };
      }

      case CheckType.DNS: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            dns: {
              recordType: faker.helpers.arrayElement(Object.values(DnsRecordType)),
              server: faker.internet.domainName(),
              ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
              protocol: faker.helpers.arrayElement(Object.values(DnsProtocol)),
              port: faker.number.int({ min: 1, max: 65535 }),
              validRCodes: faker.helpers.maybe(() => faker.helpers.arrayElements(Object.values(DnsResponseCodes))),
              validateAnswerRRS: faker.helpers.maybe(() => ({
                failIfMatchesRegexp: [],
                failIfNotMatchesRegexp: [],
              })),
              validateAuthorityRRS: faker.helpers.maybe(() => ({
                failIfMatchesRegexp: [],
                failIfNotMatchesRegexp: [],
              })),
              validateAdditionalRRS: faker.helpers.maybe(() => ({
                failIfMatchesRegexp: [],
                failIfNotMatchesRegexp: [],
              })),
            },
          },
        };
      }

      case CheckType.TCP: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            tcp: {
              ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
              tls: faker.helpers.maybe(() => faker.datatype.boolean()),
              tlsConfig: faker.helpers.maybe(() => tlsConfig()),
              queryResponse: faker.helpers.maybe(() => []),
            },
          },
        };
      }

      case CheckType.Traceroute: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            traceroute: {
              maxHops: faker.number.int({ min: 1, max: 10 }),
              maxUnknownHops: faker.number.int({ min: 1, max: 10 }),
              ptrLookup: faker.datatype.boolean(),
              hopTimeout: faker.number.int({ min: 1, max: 120 }),
            },
          },
        };
      }

      case CheckType.MULTI_HTTP: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            multihttp: {
              entries: [
                {
                  variables: faker.helpers.maybe(() => []),
                  request: {
                    method: faker.helpers.arrayElement(Object.values(HttpMethod)),
                    url: faker.internet.url(),
                    body: faker.helpers.maybe(() => ({
                      contentType: faker.helpers.arrayElement([
                        'application/json',
                        'application/xml',
                        'application/x-www-form-urlencoded',
                      ]),
                      contentEncoding: faker.helpers.maybe(() => faker.helpers.arrayElement(['gzip', 'deflate'])),
                      payload: faker.lorem.sentence(),
                    })),
                    headers: faker.helpers.maybe(() => []),
                    queryFields: faker.helpers.maybe(() => []),
                    postData: faker.helpers.maybe(() => ({
                      mimeType: 'text/plain',
                      text: '',
                    })),
                  },
                  checks: faker.helpers.maybe(() => []),
                },
              ],
            },
          },
        };
      }

      case CheckType.Scripted: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            scripted: {
              script: faker.lorem.text(),
            },
          },
        };
      }

      case CheckType.Browser: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            browser: {
              script: faker.lorem.text(),
            },
          },
        };
      }

      case CheckType.GRPC: {
        return {
          ...baseCheckModel({ sequence }),
          settings: {
            grpc: {
              ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
              service: faker.helpers.maybe(() => faker.lorem.word()),
              tls: faker.helpers.maybe(() => faker.datatype.boolean()),
              tlsConfig: faker.helpers.maybe(() => tlsConfig()),
            },
          },
        };
      }

      default: {
        throw new Error(`Unsupported check type: ${type}`);
      }
    }
  }),

  probe: Factory.define<Probe>(({ sequence }) => ({
    ...baseProbeModel({ sequence }),
    public: false,
  })),

  alert: Factory.define<CheckAlertPublished>(() => ({
    name: faker.helpers.arrayElement(Object.values(CheckAlertType)),
    threshold: faker.number.int({ min: 50, max: 500 }),
    created: Math.floor(faker.date.past().getTime() / 1000),
    modified: Math.floor(faker.date.recent().getTime() / 1000),
    status: "OK",
  })),
};
