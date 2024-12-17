import { faker } from '@faker-js/faker';
import { factory, manyOf, nullable, primaryKey } from '@mswjs/data';

import {
  AlertSensitivity,
  BrowserSettings,
  CheckAlertType,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  DnsSettings,
  GRPCSettings,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpSettings,
  HttpVersion,
  IpVersion,
  MultiHttpAssertionType,
  MultiHttpSettings,
  PingSettings,
  ScriptedSettings,
  TcpSettings,
  TracerouteSettings,
} from 'types';
import { AssertionConditionVariant, AssertionSubjectVariant } from 'components/MultiHttp/MultiHttpTypes';

const baseCheckModel = () => ({
  id: primaryKey(() => faker.number.int({ min: 1, max: 999999 })),
  job: () => faker.lorem.word(),
  target: () => faker.internet.domainName(),
  frequency: () => faker.number.int({ min: 1, max: 60 * 1000 }),
  timeout: () => faker.number.int({ min: 30, max: 60 * 1000 }),
  enabled: () => faker.datatype.boolean(),
  alertSensitivity: () => faker.helpers.arrayElement(Object.values(AlertSensitivity)),
  basicMetricsOnly: () => faker.datatype.boolean(),
  labels: () => [{ name: faker.animal.petName(), value: faker.color.human() } as any],
  probes: () => [] as number[],
  modified: () => Math.floor(faker.date.recent().getTime() / 1000),
  created: () => Math.floor(faker.date.past().getTime() / 1000),
});

const tlsConfig = () => ({
  caCert: nullable(String),
  clientCert: nullable(String),
  clientKey: nullable(String),
  insecureSkipVerify: nullable(Boolean),
  serverName: nullable(String),
});

export const db = factory({
  multiHTTPVariable: {
    id: primaryKey(() => faker.string.uuid()),

    type: () => faker.number.int({ min: 1, max: 3 }),
    name: () => faker.lorem.word(),
    expression: () => faker.lorem.word(),
    attribute: nullable(() => faker.lorem.word()),
  },

  assertionText: {
    id: primaryKey(() => faker.string.uuid()),

    condition: () => faker.helpers.arrayElement(Object.values(AssertionConditionVariant)),
    subject: () => faker.helpers.arrayElement(Object.values(AssertionSubjectVariant)),
    type: () => faker.helpers.arrayElement(Object.values(MultiHttpAssertionType.Text)),
    value: () => faker.lorem.word(),
  },

  assertionJsonPathValue: {
    id: primaryKey(() => faker.string.uuid()),

    condition: () => faker.helpers.arrayElement(Object.values(AssertionConditionVariant)),
    expression: () => faker.lorem.word(),
    type: () => faker.helpers.arrayElement(Object.values(MultiHttpAssertionType.JSONPathValue)),
    value: () => faker.lorem.word(),
  },

  assertionJsonPath: {
    id: primaryKey(() => faker.string.uuid()),

    expression: () => faker.lorem.word(),
    type: () => faker.helpers.arrayElement(Object.values(MultiHttpAssertionType.JSONPath)),
  },

  assertionRegex: {
    id: primaryKey(() => faker.string.uuid()),

    expression: () => faker.lorem.word(),
    type: () => faker.helpers.arrayElement(Object.values(MultiHttpAssertionType.Regex)),
    subject: () => faker.helpers.arrayElement(Object.values(AssertionSubjectVariant)),
  },

  httpCheck: {
    ...baseCheckModel(),
    settings: {
      http: {
        method: () => faker.helpers.arrayElement(Object.values(HttpMethod)),
        headers: nullable(Array),
        body: nullable(String),
        ipVersion: () => faker.helpers.arrayElement(Object.values(IpVersion)),
        noFollowRedirects: () => faker.datatype.boolean(),
        tlsConfig: nullable(tlsConfig()),
        compression: nullable(() => faker.helpers.arrayElement(Object.values(HTTPCompressionAlgo))),
        proxyURL: nullable(String),
        proxyConnectHeaders: nullable(Array),

        bearerToken: nullable(() => faker.lorem.word()),
        basicAuth: nullable({ username: faker.internet.username, password: faker.internet.password }),

        failIfSSL: nullable(() => faker.datatype.boolean()),
        failIfNotSSL: nullable(() => faker.datatype.boolean()),
        validStatusCodes: nullable(() => [] as number[]),
        validHTTPVersions: nullable(() => faker.helpers.arrayElements(Object.values(HttpVersion))),
        failIfBodyMatchesRegexp: nullable(() => [] as string[]),
        failIfBodyNotMatchesRegexp: nullable(() => [] as string[]),
        failIfHeaderMatchesRegexp: nullable(Array),
        failIfHeaderNotMatchesRegexp: nullable(Array),

        cacheBustingQueryParamName: nullable(() => faker.lorem.word()),
      } as unknown as HttpSettings,
    } as any,
  },

  pingCheck: {
    ...baseCheckModel(),
    settings: {
      ping: {
        ipVersion: () => faker.helpers.arrayElement(Object.values(IpVersion)),
        dontFragment: () => faker.datatype.boolean(),
      } as unknown as PingSettings,
    } as any,
  },

  dnsCheck: {
    ...baseCheckModel(),
    settings: {
      dns: {
        recordType: () => faker.helpers.arrayElement(Object.values(DnsRecordType)),
        server: () => faker.internet.domainName(),
        ipVersion: () => faker.helpers.arrayElement(Object.values(IpVersion)),
        protocol: () => faker.helpers.arrayElement(Object.values(DnsProtocol)),
        port: () => faker.number.int({ min: 1, max: 65535 }),

        validRCodes: nullable(() => faker.helpers.arrayElements(Object.values(DnsResponseCodes))),
        validateAnswerRRS: nullable({
          failIfMatchesRegexp: () => [] as string[],
          failIfNotMatchesRegexp: () => [] as string[],
        }),
        validateAuthorityRRS: nullable({
          failIfMatchesRegexp: () => [] as string[],
          failIfNotMatchesRegexp: () => [] as string[],
        }),
        validateAdditionalRRS: nullable({
          failIfMatchesRegexp: () => [] as string[],
          failIfNotMatchesRegexp: () => [] as string[],
        }),
      } as unknown as DnsSettings,
    } as any,
  },

  tcpCheck: {
    ...baseCheckModel(),
    settings: {
      tcp: {
        ipVersion: () => faker.helpers.arrayElement(Object.values(IpVersion)),
        tls: nullable(() => faker.datatype.boolean()),
        tlsConfig: nullable(tlsConfig()),
        queryResponse: nullable(
          () =>
            faker.helpers.arrayElements([
              {
                send: () => faker.lorem.word,
                expect: () => faker.lorem.word(),
                startTLS: () => faker.datatype.boolean(),
              },
            ]) as any
        ),
      } as unknown as TcpSettings,
    } as any,
  },

  tracerouteCheck: {
    ...baseCheckModel(),
    settings: {
      traceroute: {
        maxHops: () => faker.number.int({ min: 1, max: 10 }),
        maxUnknownHops: () => faker.number.int({ min: 1, max: 10 }),
        ptrLookup: () => faker.datatype.boolean(),
        hopTimeout: () => faker.number.int({ min: 1, max: 120 }),
      } as unknown as TracerouteSettings,
    } as any,
  },

  multiHTTPCheck: {
    ...baseCheckModel(),
    settings: {
      multihttp: {
        entries: () =>
          faker.helpers.arrayElements([
            {
              variables: nullable(manyOf('multiHTTPVariable')),
              request: {
                method: () => faker.helpers.arrayElement(Object.values(HttpMethod)),
                url: () => faker.internet.url(),
                body: nullable({
                  contentType: () =>
                    faker.helpers.arrayElement([
                      'application/json',
                      'application/xml',
                      'application/x-www-form-urlencoded',
                    ]),
                  contentEncoding: nullable(() => faker.helpers.arrayElement(['gzip', 'deflate'])),
                  payload: () => faker.lorem.sentence(),
                }),
                headers: nullable(Array),
                queryFields: nullable(Array),
                postData: nullable({
                  mimeType: String,
                  text: String,
                }),
              },
              checks: nullable(
                manyOf('assertionText') ||
                  manyOf('assertionJsonPathValue') ||
                  manyOf('assertionJsonPath') ||
                  manyOf('assertionRegex')
              ),
            } as any,
          ]),
      } as unknown as MultiHttpSettings,
    } as any,
  },

  scriptedCheck: {
    ...baseCheckModel(),
    settings: {
      scripted: {
        script: () => faker.lorem.text(),
      } as unknown as ScriptedSettings,
    } as any,
  },

  browserCheck: {
    ...baseCheckModel(),
    settings: {
      browser: {
        script: () => faker.lorem.text(),
      } as unknown as BrowserSettings,
    } as any,
  },

  grpcCheck: {
    ...baseCheckModel(),
    settings: {
      grpc: {
        ipVersion: () => faker.helpers.arrayElement(Object.values(IpVersion)),
        service: nullable(() => faker.lorem.word()),
        tls: nullable(() => faker.datatype.boolean()),
        tlsConfig: nullable(tlsConfig()),
      } as unknown as GRPCSettings,
    } as any,
  },

  probe: {
    id: primaryKey(() => faker.number.int({ min: 1, max: 999999 })),
    name: () => faker.string.uuid(),
    public: () => faker.datatype.boolean(),
    latitude: () => faker.location.latitude(),
    longitude: () => faker.location.longitude(),
    region: () => faker.helpers.arrayElement(['EMEA', 'AMER', 'APAC']),
    labels: () => [{ name: faker.animal.petName(), value: faker.color.human() } as any],
    online: () => faker.datatype.boolean(),
    onlineChange: () => faker.date.past().getTime() / 1000,
    version: () => faker.system.semver(),
    deprecated: () => false,
    modified: () => Math.floor(faker.date.recent().getTime() / 1000),
    created: () => Math.floor(faker.date.past().getTime() / 1000),
    capabilities: {
      disableScriptedChecks: () => faker.datatype.boolean(),
      disableBrowserChecks: () => faker.datatype.boolean(),
    } as any,
  },
  alert: {
    id: primaryKey(() => faker.number.int({ min: 1, max: 999999 })),
    name: () => faker.helpers.arrayElement(Object.values(CheckAlertType)),
    threshold: () => faker.number.int({ min: 50, max: 500 }),
    created: () => Math.floor(faker.date.past().getTime() / 1000),
    modified: () => Math.floor(faker.date.recent().getTime() / 1000),
  },
});

export function clean<T>(obj: T): T {
  const keys = [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)];

  const cleanedObject = keys.reduce((acc, key) => {
    if (typeof key !== 'symbol') {
      acc[key as keyof T] = obj[key as keyof T];
    }
    return acc;
  }, {} as T);

  return cleanedObject;
}
