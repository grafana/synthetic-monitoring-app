import {
  AlertSensitivity,
  Check,
  DNSCheck,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  DNSRRValidator,
  HTTPCheck,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpVersion,
  IpVersion,
  Label,
  MultiHTTPCheck,
  PingCheck,
  ScriptedCheck,
  TCPCheck,
  TracerouteCheck,
} from 'types';
import { AdHocCheckResponse } from 'datasource/responses.types';

import { PRIVATE_PROBE, PUBLIC_PROBE } from './probes';

export const validCert = `-----BEGIN CERTIFICATE-----
MIICUTCCAfugAwIBAgIBADANBgkqhkiG9w0BAQQFADBXMQswCQYDVQQGEwJDTjEL
MAkGA1UECBMCUE4xCzAJBgNVBAcTAkNOMQswCQYDVQQKEwJPTjELMAkGA1UECxMC
VU4xFDASBgNVBAMTC0hlcm9uZyBZYW5nMB4XDTA1MDcxNTIxMTk0N1oXDTA1MDgx
NDIxMTk0N1owVzELMAkGA1UEBhMCQ04xCzAJBgNVBAgTAlBOMQswCQYDVQQHEwJD
TjELMAkGA1UEChMCT04xCzAJBgNVBAsTAlVOMRQwEgYDVQQDEwtIZXJvbmcgWWFu
ZzBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQCp5hnG7ogBhtlynpOS21cBewKE/B7j
V14qeyslnr26xZUsSVko36ZnhiaO/zbMOoRcKK9vEcgMtcLFuQTWDl3RAgMBAAGj
gbEwga4wHQYDVR0OBBYEFFXI70krXeQDxZgbaCQoR4jUDncEMH8GA1UdIwR4MHaA
FFXI70krXeQDxZgbaCQoR4jUDncEoVukWTBXMQswCQYDVQQGEwJDTjELMAkGA1UE
CBMCUE4xCzAJBgNVBAcTAkNOMQswCQYDVQQKEwJPTjELMAkGA1UECxMCVU4xFDAS
BgNVBAMTC0hlcm9uZyBZYW5nggEAMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEE
BQADQQA/ugzBrjjK9jcWnDVfGHlk3icNRq0oV7Ri32z/+HQX67aRfgZu7KWdI+Ju
Wm7DCfrPNGVwFWUQOmsPue9rZBgO
-----END CERTIFICATE-----`;

export const validKey = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,F57524B7B26F4694

IJ/e6Xrf4pTBSO+CHdcqGocyAj5ysUre5BwTp6Yk2w9P/r7si7YA+pivghbUzYKc
uy2hFwWG+LVajZXaG0dFXmbDHd9oYlW/SeJhPrxMvxaqC9R/x4MugAMFOhCQGMq3
XW58R70L48BIuG6TCSOAGIwMDowv5ToL4nZYnqIRT77aACcsM0ozC+LCyqmLvvsU
NV/YX4ZgMhzaT2eVK+mtOut6m1Wb7t6iUCS14dB/fTF+RaGYYZYMGut/alFaPqj0
/KKlTNxCRD99+UZDbg3TnxIFSZd00zY75votTZnlLypoB9pUFP5iQglvuQ4pD3Ux
bzU4cO0/hrdo04wORwWG/DUoAPlq8wjGei5jbEwHQJ8fNBzCl3Zy5Fx3bcAaaXEK
zB97cyqhr80f2KnyiAKzk7vmyuRtMO/6Y4yE+1mLFE7NWcRkGXLEd3+wEt8DEq2R
nQibvRTbT26HkO0bcfBAaeOYxHawdNcF2SZ1dUSZeo/teHNBI2JD5xRgtEPekXRs
bBuCmxUevuh2+Q632oOpNNpFWBJTsyTcp9cAsxTEkbOCicxLN6c1+GvwyIqfSykR
G08Y5M88n7Ey5GZ43KUbGh60vV5QN/mzhf3SotBl9+wetpm+4AmkKVUQyQVdRrn2
1jXrkUZcSN8VbYk2tB74/FFXuaaF2WRQNawceXjrvegxz3/AkjZ7ahYI4rgptCqz
OXvMk+le5tmVKbJfl1G+EZm2CqDLly5makeMKvX3fSWefKoZSbN0NuW28RgSJIQC
pqja3dWZyGl7Z9dlM+big0nbLhMdIvT8526lD+p+9aMMuBL14MhWGp4IIfvXOPR+
Ots3ZoGR9vtPQyO6YN5/CtRp1DBbRA48W9xk0BnnjSNpFBLY4ykqZj/cS01Up88x
UMATqoMLiBwKCyaeibiIXpzqPTagG3PEEJkYPsrG/zql1EktjTtNo4LaYdFuZZzb
fMmcEpFZLerCIgu2cOnhhKwCHYWbZ2MSVsgoiu6RyqqBblAfNkttthiPtCLY82sQ
2ejN3NMsq+xlc/ISc21eClUaoUXmvyaSf2E3D4CN3FAi8fD74fP64EiKr+JjMNUC
DWZ79UdwZcpl2VJ7JUAAyRzEt66U5PwQqv1U8ITjsBjykxRQ68/c/+HCOfg9NYn3
cmpK5UxdFGj6261c6nVRlLVmV0+mPj1+sWHow5jZiH81IuoL3zqGkKzqy5FkTgs4
MG3hViN9lHEmMPZdK16EPhCwvff0eBV+vhfPjmGoAE6TK3YY/yh9bfhMliLoc1jr
NmPxL0FWrNzqWxZwMtDYcXu4KUesBL6/Hr+K9HSUa8zF+4UbELJTPOd1QAU6HF7a
9BidzGMZ+J2Vjqa/NGpWckBRjWb6S7aItK6rrtORU1QHmpQlYpqEh49sreo6DCrb
s8yejjKm2gSB/KhTe1nJXcTM16Xa4qWXTv11x46FNTZPUWQ7KoI0AzzScn6StBdo
YCvzqCrla1em/Kakkws7Qu/pVj9R8ndHzoLktOi3l6lwwy5d4L697DyhP+02+eLt
SBefoVnBNp449CSHW+brvPEyKD3D5CVpTIDfu2y8+nHszfBL22wuO4T+oem5h55A
-----END RSA PRIVATE KEY-----`;

const transformedValidCert = btoa(validCert);
const transformedValidKey = btoa(validKey);

export const BASIC_DNS_CHECK: DNSCheck = {
  id: 1,
  job: 'Job name for dns',
  target: 'dns.com',
  enabled: true,
  labels: [{ name: 'dnsLabelName', value: 'dnsLabelValue' }] as Label[],
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    dns: {
      ipVersion: IpVersion.V4,
      port: 53,
      protocol: DnsProtocol.UDP,
      recordType: DnsRecordType.A,
      server: 'dns.google',
      validRCodes: [DnsResponseCodes.NOERROR] as string[],
      validateAditionalRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      } as DNSRRValidator,
      validateAnswerRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      } as DNSRRValidator,
      validateAuthorityRRS: {
        failIfMatchesRegexp: ['inverted validation'],
        failIfNotMatchesRegexp: ['not inverted validation'],
      } as DNSRRValidator,
    },
  },
} as const satisfies DNSCheck;

export const BASIC_HTTP_CHECK: HTTPCheck = {
  id: 2,
  job: 'Job name for http',
  target: 'https://http.com',
  enabled: true,
  labels: [
    {
      name: 'httpLabelName',
      value: 'httpLabelValue',
    },
  ],
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'none',
  settings: {
    http: {
      method: HttpMethod.GET,
      ipVersion: IpVersion.V4,
      noFollowRedirects: false,
      validStatusCodes: [],
      validHTTPVersions: [],
      headers: [],
      body: '',
      proxyURL: '',
      proxyConnectHeaders: [],
      cacheBustingQueryParamName: '',
      compression: undefined,
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
  basicMetricsOnly: true,
};

export const BASIC_SCRIPTED_CHECK: ScriptedCheck = {
  id: 3,
  job: 'Job name for k6',
  target: 'https://www.k6.com',
  enabled: true,
  labels: [{ name: 'scriptedLabelName', value: 'scriptedLabelValue' }],
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  timeout: 10000,
  frequency: 60000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    scripted: {
      script: btoa('console.log("hello world")'),
    },
  },
};

export const BASIC_MULTIHTTP_CHECK: MultiHTTPCheck = {
  id: 4,
  job: 'Job name for multihttp',
  target: 'https://www.multi1.com',
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  timeout: 2000,
  frequency: 110000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    multihttp: {
      entries: [
        {
          request: {
            url: 'https://www.multi1.com',
            method: HttpMethod.GET,
            headers: [
              {
                name: 'aheader',
                value: 'yarp',
              },
              {
                name: 'carne',
                value: 'asada',
              },
            ],
            queryFields: [
              {
                name: 'tacos',
                value: 'delicious',
              },
            ],
          },
          variables: [
            { type: 0, name: 'enchiladas', expression: 'mole' },
            { type: 1, name: 'salsa', expression: 'picante' },
            { type: 2, name: 'chimichanga', expression: 'delicioso', attribute: 'churro' },
          ],
          checks: [
            { type: 0, subject: 1, condition: 2, value: 'text-value' },
            { type: 1, condition: 1, expression: '$.jsonpathvalue-expression', value: 'jsonpathvalue-value' },
            { type: 2, expression: '$.jsonpath-expression' },
            { type: 3, subject: 2, expression: '/regex/' },
          ],
        },
        {
          request: {
            url: 'https://www.multi2.com',
            method: HttpMethod.POST,
            headers: [
              {
                name: 'examples',
                value: 'great',
              },
            ],
            body: {
              contentType: 'steve',
              contentEncoding: 'encoding',
              payload: btoa(`{"averyinteresting":"request body content"}`),
            },
            queryFields: [
              {
                name: 'query',
                value: 'param',
              },
              { name: 'using variable', value: '${enchiladas}' },
            ],
          },
          variables: [],
          checks: [],
        },
      ],
    },
  },
};

export const BASIC_PING_CHECK: PingCheck = {
  id: 5,
  job: 'Job name for ping',
  target: 'grafana.com',
  alertSensitivity: 'none',
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  timeout: 3000,
  frequency: 60000,
  basicMetricsOnly: true,
  settings: {
    ping: {
      ipVersion: IpVersion.V4,
      dontFragment: false,
    },
  },
};

export const BASIC_TCP_CHECK: TCPCheck = {
  id: 6,
  enabled: true,
  frequency: 60000,
  basicMetricsOnly: true,
  job: 'Job name for tcp',
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  alertSensitivity: 'none',
  settings: {
    tcp: {
      ipVersion: IpVersion.V4,
      queryResponse: [
        {
          expect: 'U1RBUlRUTFM=',
          send: 'UVVJVA==',
          startTLS: false,
        },
      ],
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
  target: 'grafana.com:43',
  timeout: 3000,
};

export const BASIC_TRACEROUTE_CHECK: TracerouteCheck = {
  id: 7,
  frequency: 120000,
  offset: 0,
  timeout: 30000,
  enabled: true,
  labels: [],
  settings: {
    traceroute: {
      maxHops: 64,
      maxUnknownHops: 15,
      ptrLookup: true,
      hopTimeout: 0,
    },
  },
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  target: 'grafana.com',
  job: 'Job name for traceroute',
  basicMetricsOnly: true,
  alertSensitivity: 'high',
  created: 1707912548.258483,
  modified: 1707912548.258483,
};

export const FULL_HTTP_CHECK: HTTPCheck = {
  id: 8,
  job: 'carne asada',
  alertSensitivity: AlertSensitivity.Medium,
  target: 'https://target.com',
  enabled: true,
  labels: [{ name: 'agreatlabel', value: 'totally awesome label' }],
  probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
  timeout: 2000,
  frequency: 120000,
  basicMetricsOnly: true,
  settings: {
    http: {
      method: HttpMethod.GET,
      compression: HTTPCompressionAlgo.gzip,
      headers: ['headerName:headerValue'],
      body: 'requestbody',
      ipVersion: IpVersion.V6,
      noFollowRedirects: true,
      tlsConfig: {
        insecureSkipVerify: true,
        caCert: transformedValidCert,
        clientCert: transformedValidCert,
        clientKey: transformedValidKey,
        serverName: 'the serverName',
      },
      validStatusCodes: [100],
      validHTTPVersions: [HttpVersion.HTTP1_0],
      failIfNotSSL: true,
      failIfSSL: false,
      bearerToken: 'a bear',
      basicAuth: { username: 'steve', password: 'stevessecurepassword' },
      proxyURL: 'https://proxygrafana.com',
      proxyConnectHeaders: [],
      cacheBustingQueryParamName: 'busted',
      failIfBodyMatchesRegexp: ['body matches'],
      failIfBodyNotMatchesRegexp: ['body not maches'],
      failIfHeaderMatchesRegexp: [{ header: 'a header', regexp: 'matches', allowMissing: true }],
      failIfHeaderNotMatchesRegexp: [{ header: 'a different header', regexp: 'not matches', allowMissing: true }],
    },
  },
};

export const CUSTOM_ALERT_SENSITIVITY_CHECK: DNSCheck = {
  ...BASIC_DNS_CHECK,
  id: 9,
  alertSensitivity: 'slightly sensitive',
};

export const BASIC_CHECK_LIST: Check[] = [
  BASIC_DNS_CHECK,
  BASIC_HTTP_CHECK,
  BASIC_SCRIPTED_CHECK,
  BASIC_MULTIHTTP_CHECK,
  BASIC_PING_CHECK,
  BASIC_TCP_CHECK,
  BASIC_TRACEROUTE_CHECK,
  FULL_HTTP_CHECK,
  CUSTOM_ALERT_SENSITIVITY_CHECK,
];

export const CheckInfo = {
  AccountingClasses: {
    dns: {
      CheckType: 0,
      CheckClass: 0,
      Series: 85,
    },
    dns_basic: {
      CheckType: 0,
      CheckClass: 0,
      Series: 29,
    },
    grpc: {
      CheckType: 7,
      CheckClass: 0,
      Series: 73,
    },
    grpc_basic: {
      CheckType: 7,
      CheckClass: 0,
      Series: 31,
    },
    grpc_ssl: {
      CheckType: 7,
      CheckClass: 0,
      Series: 75,
    },
    grpc_ssl_basic: {
      CheckType: 7,
      CheckClass: 0,
      Series: 33,
    },
    http: {
      CheckType: 1,
      CheckClass: 0,
      Series: 118,
    },
    http_basic: {
      CheckType: 1,
      CheckClass: 0,
      Series: 34,
    },
    http_ssl: {
      CheckType: 1,
      CheckClass: 0,
      Series: 122,
    },
    http_ssl_basic: {
      CheckType: 1,
      CheckClass: 0,
      Series: 38,
    },
    scripted: {
      CheckType: 5,
      CheckClass: 1,
      Series: 36,
    },
    scripted_basic: {
      CheckType: 5,
      CheckClass: 1,
      Series: 22,
    },
    multihttp: {
      CheckType: 6,
      CheckClass: 1,
      Series: 117,
    },
    multihttp_basic: {
      CheckType: 6,
      CheckClass: 1,
      Series: 33,
    },
    ping: {
      CheckType: 2,
      CheckClass: 0,
      Series: 87,
    },
    ping_basic: {
      CheckType: 2,
      CheckClass: 0,
      Series: 31,
    },
    tcp: {
      CheckType: 3,
      CheckClass: 0,
      Series: 37,
    },
    tcp_basic: {
      CheckType: 3,
      CheckClass: 0,
      Series: 23,
    },
    tcp_ssl: {
      CheckType: 3,
      CheckClass: 0,
      Series: 41,
    },
    tcp_ssl_basic: {
      CheckType: 3,
      CheckClass: 0,
      Series: 27,
    },
    traceroute: {
      CheckType: 4,
      CheckClass: 0,
      Series: 22,
    },
    traceroute_basic: {
      CheckType: 4,
      CheckClass: 0,
      Series: 22,
    },
  },
};

export const ADHOC_CHECK_RESULT: AdHocCheckResponse = {
  id: '123',
  tenantId: 1,
  timeout: 1,
  settings: {
    http: {
      ipVersion: IpVersion.V4,
      method: HttpMethod.GET,
      noFollowRedirects: true,
      tlsConfig: {},
      failIfSSL: false,
      failIfNotSSL: false,
    },
  },
  probes: [PRIVATE_PROBE.id] as number[],
  target: 'target',
};
