import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import {
  AlertSensitivity,
  BrowserCheck,
  CheckAlertPublished,
  CheckAlertType,
  DNSCheck,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  GRPCCheck,
  HeaderMatch,
  HTTPCheck,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpVersion,
  IpVersion,
  Label,
  MultiHTTPCheck,
  PingCheck,
  Probe,
  ScriptedCheck,
  TCPCheck,
  TCPQueryResponse,
  TracerouteCheck,
} from 'types';
import { Assertion, MultiHttpVariable } from 'components/MultiHttp/MultiHttpTypes';

const baseCheckModel = () => ({
  id: faker.number.int({ min: 1, max: 999999 }),
  job: faker.lorem.word(),
  target: faker.internet.domainName(),
  frequency: faker.number.int({ min: 1, max: 60 * 1000 }),
  timeout: faker.number.int({ min: 30, max: 60 * 1000 }),
  enabled: true,
  alertSensitivity: faker.helpers.arrayElement(Object.values(AlertSensitivity)),
  basicMetricsOnly: faker.datatype.boolean(),
  labels: [{ name: faker.animal.petName(), value: faker.color.human() }],
  probes: [] as number[],
  modified: Math.floor(faker.date.recent().getTime() / 1000),
  created: Math.floor(faker.date.past().getTime() / 1000),
});

const tlsConfig = () => ({
  caCert: faker.helpers.maybe(() => faker.string.uuid()),
  clientCert: faker.helpers.maybe(() => faker.string.uuid()),
  clientKey: faker.helpers.maybe(() => faker.string.uuid()),
  insecureSkipVerify: faker.helpers.maybe(() => faker.datatype.boolean()),
  serverName: faker.helpers.maybe(() => faker.lorem.word()),
});

export const db = {
  httpCheck: Factory.define<HTTPCheck>(() => ({
    ...baseCheckModel(),
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
        proxyConnectHeaders: faker.helpers.maybe(() => [] as string[]),
        bearerToken: faker.helpers.maybe(() => faker.lorem.word()),
        basicAuth: faker.helpers.maybe(() => ({
          username: faker.internet.username(),
          password: faker.internet.password(),
        })),
        failIfSSL: faker.helpers.maybe(() => faker.datatype.boolean()),
        failIfNotSSL: faker.helpers.maybe(() => faker.datatype.boolean()),
        validStatusCodes: faker.helpers.maybe(() => [] as number[]),
        validHTTPVersions: faker.helpers.maybe(() => faker.helpers.arrayElements(Object.values(HttpVersion))),
        failIfBodyMatchesRegexp: faker.helpers.maybe(() => [] as string[]),
        failIfBodyNotMatchesRegexp: faker.helpers.maybe(() => [] as string[]),
        failIfHeaderMatchesRegexp: faker.helpers.maybe(() => [] as HeaderMatch[]),
        failIfHeaderNotMatchesRegexp: faker.helpers.maybe(() => [] as HeaderMatch[]),
        cacheBustingQueryParamName: faker.helpers.maybe(() => faker.lorem.word()),
      },
    },
  })),

  pingCheck: Factory.define<PingCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      ping: {
        ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
        dontFragment: faker.datatype.boolean(),
      },
    },
  })),

  dnsCheck: Factory.define<DNSCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      dns: {
        recordType: faker.helpers.arrayElement(Object.values(DnsRecordType)),
        server: faker.internet.domainName(),
        ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
        protocol: faker.helpers.arrayElement(Object.values(DnsProtocol)),
        port: faker.number.int({ min: 1, max: 65535 }),
        validRCodes: faker.helpers.maybe(() => faker.helpers.arrayElements(Object.values(DnsResponseCodes))),
        validateAnswerRRS: faker.helpers.maybe(() => ({
          failIfMatchesRegexp: [] as string[],
          failIfNotMatchesRegexp: [] as string[],
        })),
        validateAuthorityRRS: faker.helpers.maybe(() => ({
          failIfMatchesRegexp: [] as string[],
          failIfNotMatchesRegexp: [] as string[],
        })),
        validateAdditionalRRS: faker.helpers.maybe(() => ({
          failIfMatchesRegexp: [] as string[],
          failIfNotMatchesRegexp: [] as string[],
        })),
      },
    },
  })),

  tcpCheck: Factory.define<TCPCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      tcp: {
        ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
        tls: faker.helpers.maybe(() => faker.datatype.boolean()),
        tlsConfig: faker.helpers.maybe(() => tlsConfig()),
        queryResponse: faker.helpers.maybe(() => [] as TCPQueryResponse[]),
      },
    },
  })),

  tracerouteCheck: Factory.define<TracerouteCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      traceroute: {
        maxHops: faker.number.int({ min: 1, max: 10 }),
        maxUnknownHops: faker.number.int({ min: 1, max: 10 }),
        ptrLookup: faker.datatype.boolean(),
        hopTimeout: faker.number.int({ min: 1, max: 120 }),
      },
    },
  })),

  multiHTTPCheck: Factory.define<MultiHTTPCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      multihttp: {
        entries: [
          {
            variables: faker.helpers.maybe(() => [] as MultiHttpVariable[]),
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
              headers: faker.helpers.maybe(() => [] as Label[]),
              queryFields: faker.helpers.maybe(() => [] as Label[]),
              postData: faker.helpers.maybe(() => ({
                mimeType: 'text/plain',
                text: '',
              })),
            },
            checks: faker.helpers.maybe(() => [] as Assertion[]),
          },
        ],
      },
    },
  })),

  scriptedCheck: Factory.define<ScriptedCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      scripted: {
        script: faker.lorem.text(),
      },
    },
  })),

  browserCheck: Factory.define<BrowserCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      browser: {
        script: faker.lorem.text(),
      },
    },
  })),

  grpcCheck: Factory.define<GRPCCheck>(() => ({
    ...baseCheckModel(),
    settings: {
      grpc: {
        ipVersion: faker.helpers.arrayElement(Object.values(IpVersion)),
        service: faker.helpers.maybe(() => faker.lorem.word()),
        tls: faker.helpers.maybe(() => faker.datatype.boolean()),
        tlsConfig: faker.helpers.maybe(() => tlsConfig()),
      },
    },
  })),

  probe: Factory.define<Probe>(() => ({
    id: faker.number.int({ min: 1, max: 999999 }),
    name: faker.string.uuid(),
    public: faker.datatype.boolean(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    region: faker.helpers.arrayElement(['EMEA', 'AMER', 'APAC']),
    labels: [{ name: faker.animal.petName(), value: faker.color.human() }],
    online: faker.datatype.boolean(),
    onlineChange: Math.floor(faker.date.past().getTime() / 1000),
    version: faker.system.semver(),
    deprecated: false,
    modified: Math.floor(faker.date.recent().getTime() / 1000),
    created: Math.floor(faker.date.past().getTime() / 1000),
    capabilities: {
      disableScriptedChecks: faker.datatype.boolean(),
      disableBrowserChecks: faker.datatype.boolean(),
    },
  })),

  alert: Factory.define<CheckAlertPublished>(() => ({
    id: faker.number.int({ min: 1, max: 999999 }),
    name: faker.helpers.arrayElement(Object.values(CheckAlertType)),
    threshold: faker.number.int({ min: 50, max: 500 }),
    created: Math.floor(faker.date.past().getTime() / 1000),
    modified: Math.floor(faker.date.recent().getTime() / 1000),
  })),
};
