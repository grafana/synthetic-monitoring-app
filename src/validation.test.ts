import {
  validateCheck,
  CheckValidation,
  validateTLSCACert,
  validateTLSClientCert,
  validateTLSClientKey,
  validateLabelName,
  validateLabelValue,
} from 'validation';
import {
  Check,
  CheckType,
  HttpMethod,
  IpVersion,
  DnsRecordType,
  DnsProtocol,
  AlertSensitivity,
  HTTPCompressionAlgo,
} from 'types';
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
          compression: HTTPCompressionAlgo.none,
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

describe('http', () => {
  it('should reject non-http URLs', () => {
    const testcases: string[] = ['ftp://example.org/', 'schema://example.org/'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toEqual('Target must be a valid web URL');
    });
  });

  it.only('should reject an http target without TLD', () => {
    expect(CheckValidation.target(CheckType.HTTP, 'https://hostname/')).toEqual('Target must have a valid hostname');
    expect(CheckValidation.target(CheckType.HTTP, 'https://suraj/dev')).toEqual('Target must have a valid hostname');
  });
  it('should reject URLs without schema', () => {
    const testcases: string[] = ['example.org'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.HTTP, testcase)).toEqual('Target must be a valid web URL');
    });
  });

  it('should reject malformed ipv6 https targets', () => {
    const url = 'https://[2001:0db8:1001:1001:1001:1001:1001:1001/';
    expect(CheckValidation.target(CheckType.HTTP, url)).toBe('Target must be a valid web URL');
  });

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

  it('should accept urls with curly brackets in param values', () => {
    expect(CheckValidation.target(CheckType.HTTP, 'https://example.com?data={name%3Asteve}')).toBe(undefined);
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
});

describe('PING', () => {
  it('should reject hostnames without domains', () => {
    expect(CheckValidation.target(CheckType.PING, 'grafana')).toBe('Target must be a valid hostname');
  });
  it('should reject ping targets with invalid hostnames', () => {
    const testcases: string[] = ['x.', '.y', 'x=y.org'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.PING, testcase)).toBe('Target must be a valid hostname');
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
});

describe('DNS', () => {
  it('should reject single element domains', () => {
    expect(CheckValidation.target(CheckType.DNS, 'grafana')).toBe('Invalid number of elements in hostname');
  });

  it('should reject dns targets with invalid element length', () => {
    expect(CheckValidation.target(CheckType.DNS, '.y')).toBe(
      'Invalid domain element length. Each element must be between 1 and 62 characters'
    );
  });

  it('should reject dns targets with invalid characters', () => {
    expect(CheckValidation.target(CheckType.DNS, 'x=y.org')).toBe(
      'Invalid character in domain name. Only letters, numbers and "-" are allowed'
    );
  });

  it('should reject ip address', () => {
    expect(CheckValidation.target(CheckType.DNS, '127.0.0.1')).toBe('IP addresses are not valid DNS targets');
  });

  it('IP address disguised as multi-label fully qualified  dns name is invalid', () => {
    expect(CheckValidation.target(CheckType.DNS, '127.0.0.1.')).toBe('A domain TLD cannot contain only numbers');
  });

  it('should accept dns targets with trailing .', () => {
    expect(CheckValidation.target(CheckType.DNS, 'grafana.')).toBe(undefined);
  });

  it('should accept valid hostnames', () => {
    expect(CheckValidation.target(CheckType.DNS, 'grafana.com')).toBe(undefined);
  });
});

describe('tcp', () => {
  it('should reject tcp targets without valid ports', () => {
    expect(CheckValidation.target(CheckType.TCP, 'x:y')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'x:y:')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'x:y:0')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'x:y:65536')).toBe('Must be a valid host:port combination');
    expect(CheckValidation.target(CheckType.TCP, 'grafana.com:65536')).toBe('Port must be less than 65535');
    expect(CheckValidation.target(CheckType.TCP, 'grafana.com:0')).toBe('Port must be greater than 0');
  });

  it('should accept tcp targets with host:port', () => {
    const testcases: string[] = ['x.y:25', '1.2.3.4:25', '[2001:0db8:1001:1001:1001:1001:1001:1001]:8080'];
    testcases.forEach((testcase: string) => {
      expect(CheckValidation.target(CheckType.TCP, testcase)).toBe(undefined);
    });
  });
});

describe('certificates', () => {
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

describe('labels', () => {
  it('rejects duplicate label names', () => {
    const error = validateLabelName('a_name', [
      { name: 'a_name', value: 'a_value' },
      { name: 'a_name', value: 'a_different_value' },
    ]);
    expect(error).toBe('Label names cannot be duplicated');
  });

  it('rejects label names that are too long', () => {
    const longLabelName =
      'LoremipsumdolorsitametconsecteturadipiscingelitSedhendreritnonnibhetaliquetPraesentquisjustoacnibhtempusidstoacnibhtempusidstoacnibhtempusidstoacnibhtempusid';
    const error = validateLabelName(longLabelName, []);
    const shortEnough = validateLabelName(longLabelName.slice(0, 127), []);
    expect(error).toBe('Label names must be 128 characters or less');
    expect(shortEnough).toBe(undefined);
  });

  it('rejects label values that are too long', () => {
    const longLabelValue =
      'LoremipsumdolorsitametconsecteturadipiscingelitSedhendreritnonnibhetaliquetPraesentquisjustoacnibhtempusidstoacnibhtempusidstoacnibhtempusidstoacnibhtempusid';
    const error = validateLabelValue(longLabelValue);
    const shortEnough = validateLabelValue(longLabelValue.slice(0, 127));
    expect(error).toBe('Label values must be 128 characters or less');
    expect(shortEnough).toBe(undefined);
  });
});
