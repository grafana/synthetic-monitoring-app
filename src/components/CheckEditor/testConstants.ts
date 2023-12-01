import {
  AlertSensitivity,
  Check,
  DnsResponseCodes,
  HTTPCompressionAlgo,
  HttpMethod,
  HttpVersion,
  IpVersion,
} from 'types';

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

export const transformedValidCert = btoa(validCert);
export const transformedValidKey = btoa(validKey);

export const BASIC_HTTP_CHECK = {
  job: 'Job name',
  target: 'https://grafana.com',
  enabled: true,
  labels: [
    {
      name: 'labelName',
      value: 'labelValue',
    },
  ],
  probes: [42],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'none',
  settings: {
    http: {
      method: 'GET',
      ipVersion: 'V4',
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

export const BASIC_PING_CHECK = {
  job: 'Job name',
  target: 'grafana.com',
  alertSensitivity: 'none',
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  timeout: 3000,
  frequency: 60000,
  basicMetricsOnly: true,
  settings: {
    ping: {
      ipVersion: 'V4',
      dontFragment: false,
    },
  },
};

export const BASIC_TCP_CHECK = {
  enabled: true,
  frequency: 60000,
  basicMetricsOnly: true,
  job: 'Job name',
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  alertSensitivity: 'none',
  settings: {
    tcp: {
      ipVersion: 'V4',
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

export const BASIC_DNS_CHECK = {
  job: 'Job name',
  target: 'grafana.com',
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    dns: {
      ipVersion: 'V4',
      port: 53,
      protocol: 'UDP',
      recordType: 'A',
      server: 'dns.google',
      validRCodes: [DnsResponseCodes.NOERROR],
      validateAditionalRRS: {
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
};

export const BASIC_K6_CHECK = {
  job: 'Job name',
  target: 'https://www.grafana.com',
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    k6: {
      script: btoa('console.log("hello world")'),
    },
  },
};

export const CUSTOM_ALERT_SENSITIVITY_CHECK = {
  job: 'Job name',
  target: 'grafana.com',
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'slightly sensitive',
  basicMetricsOnly: true,
  settings: {
    dns: {
      ipVersion: 'V4',
      port: 53,
      protocol: 'UDP',
      recordType: 'A',
      server: 'dns.google',
      validRCodes: [DnsResponseCodes.NOERROR],
      validateAditionalRRS: {
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
};

export const BASIC_MULTIHTTP_CHECK = {
  job: 'basicmulti',
  target: 'https://www.grafana.com',
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  timeout: 2000,
  frequency: 110000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    multihttp: {
      entries: [
        {
          request: {
            url: 'https://www.grafana.com',
            method: 'GET',
            body: undefined,
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
            url: 'https://www.example.com',
            method: 'POST',
            headers: [
              {
                name: 'examples',
                value: 'great',
              },
            ],
            body: {
              contentType: 'steve',
              contentEncoding: 'encoding',
              payload: 'eyJhdmVyeWludGVyZXN0aW5nIjoicmVxdWVzdCBib2R5IGNvbnRlbnQifQ==',
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

export const BASIC_CHECK_LIST = [
  {
    job: 'carne asada',
    id: 1,
    alertSensitivity: AlertSensitivity.Medium,
    target: 'https://target.com',
    enabled: true,
    labels: [{ name: 'agreatlabel', value: 'totally awesome label' }],
    probes: [42],
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
          serverName: 'serverName',
        },
        validStatusCodes: [100],
        validHTTPVersions: [HttpVersion.HTTP1_0],
        failIfNotSSL: true,
        failIfSSL: false,
        bearerToken: 'a bear',
        basicAuth: { username: 'steve', password: 'stevessecurepassword' },
        proxyURL: 'https://grafana.com',
        cacheBustingQueryParamName: 'busted',
        failIfBodyMatchesRegexp: ['body matches'],
        failIfBodyNotMatchesRegexp: ['body not maches'],
        failIfHeaderMatchesRegexp: [{ header: 'a header', regexp: 'matches', allowMissing: true }],
        failIfHeaderNotMatchesRegexp: [{ header: 'a different header', regexp: 'not matches', allowMissing: true }],
      },
    },
  },
  { id: 2, ...BASIC_DNS_CHECK },
  { id: 3, ...BASIC_PING_CHECK },
  { id: 4, ...BASIC_TCP_CHECK },
  { id: 5, ...CUSTOM_ALERT_SENSITIVITY_CHECK },
  { id: 6, ...BASIC_MULTIHTTP_CHECK },
  { id: 7, ...BASIC_K6_CHECK },
] as Check[];

export const EDITED_HTTP_CHECK = {
  id: 1,
  tenantId: undefined,
  job: 'carne asadatacos',
  target: 'https://target.com',
  basicMetricsOnly: true,
  enabled: true,
  labels: [{ name: 'agreatlabel', value: 'totally awesome label' }],
  probes: [42],
  timeout: 2000,
  frequency: 120000,
  alertSensitivity: 'medium',
  settings: {
    http: {
      basicAuth: { username: 'stevea username', password: 'stevessecurepassworda password' },
      method: 'GET',
      ipVersion: 'V6',
      noFollowRedirects: true,
      compression: 'deflate',
      proxyURL: 'https://grafana.comhttps://grafana.com',
      body: 'requestbodyrequestbody',
      tlsConfig: {
        caCert: transformedValidCert,
        clientCert: transformedValidCert,
        clientKey: transformedValidKey,
        serverName: 'serverNameserverName',
        insecureSkipVerify: true,
      },
      headers: ['headerName:headerValue', 'headerName:headerValue'],
      proxyConnectHeaders: [],
      validStatusCodes: [100],
      validHTTPVersions: ['HTTP/1.0'],
      failIfNotSSL: true,
      failIfSSL: false,
      bearerToken: 'a beara bearer token',
      failIfHeaderMatchesRegexp: [{ regexp: 'matches', allowMissing: true, header: 'a headerContent-Type' }],
      failIfBodyMatchesRegexp: ['body not machesa body regex'],
      failIfBodyNotMatchesRegexp: ['body matchesa header regex', 'not matches'],
      failIfHeaderNotMatchesRegexp: [],
      cacheBustingQueryParamName: 'busted',
    },
  },
};

export const EDITED_TCP_CHECK = {
  id: 4,
  enabled: true,
  frequency: 60000,
  basicMetricsOnly: true,
  job: 'Job name',
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  alertSensitivity: 'none',
  settings: {
    tcp: {
      ipVersion: 'V4',
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
  tenantId: undefined,
  timeout: 3000,
};

export const EDITED_DNS_CHECK = {
  id: 2,
  job: 'Job name',
  target: 'grafana.com',
  tenantId: undefined,
  enabled: true,
  labels: [{ name: 'labelName', value: 'labelValue' }],
  probes: [42],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    dns: {
      ipVersion: 'V4',
      port: 53,
      protocol: 'UDP',
      recordType: 'A',
      server: 'dns.google',
      validRCodes: [DnsResponseCodes.NOERROR],
      validateAditionalRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
      validateAnswerRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: ['not inverted validation', 'inverted validation'],
      },
      validateAuthorityRRS: {
        failIfMatchesRegexp: [],
        failIfNotMatchesRegexp: [],
      },
    },
  },
};

export const EDITED_K6_CHECK = {
  job: 'different job name',
  target: 'https://www.example.com',
  enabled: true,
  labels: [{ name: 'adifferentlabelname', value: 'adifferentlabelValue' }],
  probes: [32],
  timeout: 3000,
  frequency: 60000,
  alertSensitivity: 'none',
  basicMetricsOnly: true,
  settings: {
    k6: {
      script: btoa('console.log("goodnight moon")'),
    },
  },
};
