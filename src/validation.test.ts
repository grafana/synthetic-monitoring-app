import { validateCheck, CheckValidation } from 'validation';
import { Check, CheckType, HttpMethod, IpVersion, DnsRecordType, DnsProtocol } from 'types';
jest.unmock('utils');

describe('trivial cases', () => {
  it('should be a valid http check', () => {
    const check: Check = {
      job: 'job-1',
      target: 'https://grafana.com/',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
      settings: {
        http: {
          method: HttpMethod.GET,
          ipVersion: IpVersion.V4,
          noFollowRedirects: false,
        },
      },
    };

    expect(validateCheck(check)).toBe(true);
  });

  it('should be a valid ping check', () => {
    const check: Check = {
      job: 'job-1',
      target: 'grafana.com',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
      settings: {
        ping: {
          ipVersion: IpVersion.V4,
          dontFragment: true,
        },
      },
    };

    expect(validateCheck(check)).toBe(true);
  });

  it('should be a valid dns check', () => {
    const check: Check = {
      job: 'job-1',
      target: 'grafana.com',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
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

    expect(validateCheck(check)).toBe(true);
  });

  it('should be a valid tcp check', () => {
    const check: Check = {
      job: 'job-1',
      target: 'grafana.com:80',
      frequency: 10000,
      timeout: 1000,
      labels: [],
      probes: [1],
      enabled: true,
      settings: {
        tcp: {
          ipVersion: IpVersion.V4,
          tls: false,
        },
      },
    };

    expect(validateCheck(check)).toBe(true);
  });
});

describe('bad targets', () => {
  it('should reject non-http URLs', () => {
    const testcases: string[] = ['ftp://example.org/', 'schema://example.org/'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(false);
    });
  });

  it('should reject URLs without schema', () => {
    const testcases: string[] = ['example.org'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(false);
    });
  });

  it('should reject ping and dns targets without domains', () => {
    const testcases: string[] = ['grafana'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe(false);
      expect(CheckValidation.target(CheckType.DNS, testcase)).toBe(false);
    });
  });

  it('should reject ping targets with invalid hostnames', () => {
    const testcases: string[] = ['1.org', 'x.', '.y', 'x=y.org'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe(false);
      expect(CheckValidation.target(CheckType.DNS, testcase)).toBe(false);
    });
  });

  it('should reject tcp targets without valid ports', () => {
    const testcases: string[] = ['x.y', 'x.y:', 'x.y:0', 'x.y:65536'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.TCP, testcase)).toBe(false);
    });
  });
});

describe('good targets', () => {
  it('should accept http schema as HTTP target', () => {
    const testcases: string[] = ['http://grafana.com/'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(true);
    });
  });

  it('should accept https schema as HTTP target', () => {
    const testcases: string[] = ['https://grafana.com/'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(true);
    });
  });

  it('should accept URL with IP addresses as HTTP target', () => {
    const testcases: string[] = [
      'http://1.2.3.4/',
      'http://1.2.3.4:8080/',
      'http://[2001:0db8:1001:1001:1001:1001:1001:1001]/',
      'http://[2001:0db8:1001:1001:1001:1001:1001:1001]:8080/',
      'https://1.2.3.4/',
      'https://1.2.3.4:8080/',
      'https://[2001:0db8:1001:1001:1001:1001:1001:1001]/',
      'https://[2001:0db8:1001:1001:1001:1001:1001:1001]:8080/',
    ];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toBe(true);
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
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe(true);
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
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe(true);
    });
  });

  it('should accept tcp targets with host:port', () => {
    const testcases: string[] = ['x.y:25', '1.2.3.4:25', '[2001:0db8:1001:1001:1001:1001:1001:1001]:8080'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.TCP, testcase)).toBe(true);
    });
  });
});
