import {
  validateCheck,
  CheckValidation,
  validateTLSCACert,
  validateTLSClientCert,
  validateTLSClientKey,
  validateLabelName,
} from 'validation';
import { Check, CheckType, HttpMethod, IpVersion, DnsRecordType, DnsProtocol, AlertSensitivity } from 'types';
jest.unmock('utils');

describe('trivial cases', () => {
  it('should be a valid http check', () => {
    const check: Check = {
      job: 'job-1',
      alertSensitivity: AlertSensitivity.None,
      target: 'https://grafana.com/',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
      basicMetricsOnly: true,
      settings: {
        http: {
          method: HttpMethod.GET,
          ipVersion: IpVersion.V4,
          noFollowRedirects: false,
        },
      },
    };

    expect(validateCheck(check)).toBe(false);
  });

  it('should be a valid ping check', () => {
    const check: Check = {
      job: 'job-1',
      alertSensitivity: AlertSensitivity.None,
      target: 'grafana.com',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
      basicMetricsOnly: true,
      settings: {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: true,
        },
      },
    };

    expect(validateCheck(check)).toBe(false);
  });

  it('should be a valid dns check', () => {
    const check: Check = {
      job: 'job-1',
      alertSensitivity: AlertSensitivity.None,
      target: 'grafana.com',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
      basicMetricsOnly: true,
      settings: {
        dns: {
          recordType: DnsRecordType.A,
          server: '8.8.8.8',
          ipVersion: IpVersion.V4,
          protocol: DnsProtocol.TCP,
          port: 53,
        },
      },
    };

    expect(validateCheck(check)).toBe(false);
  });

  it('should be a valid tcp check', () => {
    const check: Check = {
      job: 'job-1',
      alertSensitivity: AlertSensitivity.None,
      target: 'grafana.com:80',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
      basicMetricsOnly: true,
      settings: {
        tcp: {
          ipVersion: IpVersion.V4,
          tls: false,
        },
      },
    };

    expect(validateCheck(check)).toBe(false);
  });
});

describe('bad targets', () => {
  it('should reject non-http URLs', () => {
    const testcases: string[] = ['ftp://example.org/', 'schema://example.org/'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toEqual('Target must be a valid web URL');
    });
  });

  it('should reject an http target without TLD', () => {
    expect(CheckValidation.target(CheckType.HTTP, 'https://hostname/')).toEqual('Target must have a valid hostname');
    expect(CheckValidation.target(CheckType.HTTP, 'https://suraj/dev')).toEqual('Target must have a valid hostname');
  });

  it('should reject URLs without schema', () => {
    const testcases: string[] = ['example.org'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toEqual('Target must be a valid web URL');
    });
  });

  it('should reject ping and dns targets without domains', () => {
    const testcases: string[] = ['grafana'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe('Target must be a valid hostname');
      expect(CheckValidation.target(CheckType.DNS, testcase)).toBe('Target must be a valid hostname');
    });
  });

  it('should reject malformed ipv6 https targets', () => {
    const url = 'https://[2001:0db8:1001:1001:1001:1001:1001:1001/';
    expect(CheckValidation.target(CheckType.HTTP, url)).toBe('Target must be a valid web URL');
  });

  it('should reject ping targets with invalid hostnames', () => {
    const testcases: string[] = ['x.', '.y', 'x=y.org'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe('Target must be a valid hostname');
      expect(CheckValidation.target(CheckType.DNS, testcase)).toBe('Target must be a valid hostname');
    });
  });

  it('should reject tcp targets without valid ports', () => {
    expect(CheckValidation.target(CheckType.TCP, 'x:y')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'x:y:')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'x:y:0')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'x:y:65536')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'grafana.com:65536')).toBe('Port must be less than 65535');
    expect(CheckValidation.target(CheckType.TCP, 'grafana.com:0')).toBe('Port must be greater than 0');
  });

  it('should reject invalid certificates', () => {
    const invalidCert = 'not a legit cert';
    expect(validateTLSCACert(invalidCert)).toBe('Certificate must be in the PEM format.');
    expect(validateTLSClientCert(invalidCert)).toBe('Certificate must be in the PEM format.');
  });

  it('should reject invalid tls keys', () => {
    const invalidKey = 'not a legit cert';
    expect(validateTLSClientKey(invalidKey)).toBe('Key must be in the PEM format.');
  });
});

describe('good targets', () => {
  it('should accept http schema as HTTP target', () => {
    const testcases: string[] = ['http://grafana.com/'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(undefined);
    });
  });

  it('should accept hostnames with leading numbers', () => {
    expect(CheckValidation.target(CheckType.HTTP, 'http://500grafana.com')).toBe(undefined);
    expect(CheckValidation.target(CheckType.HTTP, 'http://www.500grafana.com')).toBe(undefined);
  });

  it('should accept https schema as HTTP target', () => {
    const testcases: string[] = ['https://grafana.com/'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(undefined);
    });
  });

  it('should accept http targets with ipv6 domains', () => {
    [
      'https://[2001:0db8:1001:1001:1001:1001:1001:1001]/',
      'https://[2001:0db8:1001:1001:1001:1001:1001:1001]:8080/',
      'http://[2001:0db8:1001:1001:1001:1001:1001:1001]/',
      'http://[2001:0db8:1001:1001:1001:1001:1001:1001]:8080/',
    ].forEach((url) => expect(CheckValidation.target(CheckType.HTTP, url)).toBe(undefined));
  });

  it('should accept URL with IPv4 addresses as HTTP target', () => {
    const testcases: string[] = [
      'http://1.2.3.4/',
      'http://1.2.3.4:8080/',
      'https://1.2.3.4/',
      'https://1.2.3.4:8080/',
    ];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(undefined);
    });
  });

  it('should accept IPv4 as ping target', () => {
    const testcases: string[] = [
      '1.2.3.4',
      '127.0.0.1',
      '10.0.0.0',
      '169.254.0.0',
      '192.168.0.0',
      '172.16.0.0',
      '224.0.0.0',
    ];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe(undefined);
    });
  });

  it('should accept IPv6 as ping target', () => {
    const testcases: string[] = [
      '2600:1901:0:bae2::1',
      '::1',
      '::ffff:1.2.3.4',
      '2001:0db8:1001:1001:1001:1001:1001:1001',
      'fc00::', // unique local address
      'fe80::', // link-local address
      'ff00::', // multicast address
    ];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe(undefined);
    });
  });

  it('should accept tcp targets with host:port', () => {
    const testcases: string[] = ['x.y:25', '1.2.3.4:25', '[2001:0db8:1001:1001:1001:1001:1001:1001]:8080'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.TCP, testcase)).toBe(undefined);
    });
  });
});

describe('labels', () => {
  it('rejects duplicate label names', () => {
    const error = validateLabelName('a_name', [
      { name: 'a_name', value: 'a_value' },
      { name: 'a_name', value: 'a_different_value' },
    ]);
    expect(error).toBe('Label names cannot be duplicated');
  });
});
