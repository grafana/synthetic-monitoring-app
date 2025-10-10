import { CheckType } from 'types';
import { getCheckType } from 'utils';

import { getBrowserCheckFormValues } from '../transformations/toFormValues.browser';
import { getDNSCheckFormValues } from '../transformations/toFormValues.dns';
import { getGRPCCheckFormValues } from '../transformations/toFormValues.grpc';
import { getHTTPCheckFormValues } from '../transformations/toFormValues.http';
import { getMultiHTTPCheckFormValues } from '../transformations/toFormValues.multihttp';
import { getPingCheckFormValues } from '../transformations/toFormValues.ping';
import { getScriptedCheckFormValues } from '../transformations/toFormValues.scripted';
import { getTCPCheckFormValues } from '../transformations/toFormValues.tcp';
import { getTracerouteCheckFormValues } from '../transformations/toFormValues.traceroute';
import { getBrowserPayload } from '../transformations/toPayload.browser';
import { getDNSPayload } from '../transformations/toPayload.dns';
import { getGRPCPayload } from '../transformations/toPayload.grpc';
import { getHTTPPayload } from '../transformations/toPayload.http';
import { getMultiHTTPPayload } from '../transformations/toPayload.multihttp';
import { getPingPayload } from '../transformations/toPayload.ping';
import { getScriptedPayload } from '../transformations/toPayload.scripted';
import { getTCPPayload } from '../transformations/toPayload.tcp';
import { getTraceroutePayload } from '../transformations/toPayload.traceroute';
import { toFormValues, toPayload } from './adaptors';

// Mock the utility function
jest.mock('utils', () => ({
  ...jest.requireActual('utils'),
  getCheckType: jest.fn(),
}));

// Mock all transformation functions
jest.mock('../transformations/toFormValues.browser');
jest.mock('../transformations/toFormValues.dns');
jest.mock('../transformations/toFormValues.grpc');
jest.mock('../transformations/toFormValues.http');
jest.mock('../transformations/toFormValues.multihttp');
jest.mock('../transformations/toFormValues.ping');
jest.mock('../transformations/toFormValues.scripted');
jest.mock('../transformations/toFormValues.tcp');
jest.mock('../transformations/toFormValues.traceroute');
jest.mock('../transformations/toPayload.browser');
jest.mock('../transformations/toPayload.dns');
jest.mock('../transformations/toPayload.grpc');
jest.mock('../transformations/toPayload.http');
jest.mock('../transformations/toPayload.multihttp');
jest.mock('../transformations/toPayload.ping');
jest.mock('../transformations/toPayload.scripted');
jest.mock('../transformations/toPayload.tcp');
jest.mock('../transformations/toPayload.traceroute');

const mockGetCheckType = getCheckType as jest.MockedFunction<typeof getCheckType>;
const mockGetDNSCheckFormValues = getDNSCheckFormValues as jest.MockedFunction<typeof getDNSCheckFormValues>;
const mockGetGRPCCheckFormValues = getGRPCCheckFormValues as jest.MockedFunction<typeof getGRPCCheckFormValues>;
const mockGetHTTPCheckFormValues = getHTTPCheckFormValues as jest.MockedFunction<typeof getHTTPCheckFormValues>;
const mockGetMultiHTTPCheckFormValues = getMultiHTTPCheckFormValues as jest.MockedFunction<
  typeof getMultiHTTPCheckFormValues
>;
const mockGetPingCheckFormValues = getPingCheckFormValues as jest.MockedFunction<typeof getPingCheckFormValues>;
const mockGetScriptedCheckFormValues = getScriptedCheckFormValues as jest.MockedFunction<
  typeof getScriptedCheckFormValues
>;
const mockGetTCPCheckFormValues = getTCPCheckFormValues as jest.MockedFunction<typeof getTCPCheckFormValues>;
const mockGetTracerouteCheckFormValues = getTracerouteCheckFormValues as jest.MockedFunction<
  typeof getTracerouteCheckFormValues
>;
const mockGetBrowserCheckFormValues = getBrowserCheckFormValues as jest.MockedFunction<
  typeof getBrowserCheckFormValues
>;

// Mock payload transformation functions
const mockGetDNSPayload = getDNSPayload as jest.MockedFunction<typeof getDNSPayload>;
const mockGetGRPCPayload = getGRPCPayload as jest.MockedFunction<typeof getGRPCPayload>;
const mockGetHTTPPayload = getHTTPPayload as jest.MockedFunction<typeof getHTTPPayload>;
const mockGetMultiHTTPPayload = getMultiHTTPPayload as jest.MockedFunction<typeof getMultiHTTPPayload>;
const mockGetPingPayload = getPingPayload as jest.MockedFunction<typeof getPingPayload>;
const mockGetScriptedPayload = getScriptedPayload as jest.MockedFunction<typeof getScriptedPayload>;
const mockGetTCPPayload = getTCPPayload as jest.MockedFunction<typeof getTCPPayload>;
const mockGetTraceroutePayload = getTraceroutePayload as jest.MockedFunction<typeof getTraceroutePayload>;
const mockGetBrowserPayload = getBrowserPayload as jest.MockedFunction<typeof getBrowserPayload>;

describe('toFormValues', () => {
  const mockCheck = {
    id: 1,
    job: 'test-job',
    target: 'https://example.com',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: {},
    probes: [1],
    alertSensitivity: 'none',
    basicMetricsOnly: false,
    settings: {
      http: {
        method: 'GET',
      },
    },
  } as any;

  const mockFormValues = {
    checkType: CheckType.HTTP,
    job: 'test-job',
    target: 'https://example.com',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: {},
    probes: [1],
    alertSensitivity: 'none',
    basicMetricsOnly: false,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DNS check', () => {
    it('should call getDNSCheckFormValues for DNS check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.DNS);
      mockGetDNSCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetDNSCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('GRPC check', () => {
    it('should call getGRPCCheckFormValues for GRPC check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.GRPC);
      mockGetGRPCCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetGRPCCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('HTTP check', () => {
    it('should call getHTTPCheckFormValues for HTTP check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.HTTP);
      mockGetHTTPCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetHTTPCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('MultiHTTP check', () => {
    it('should call getMultiHTTPCheckFormValues for MULTI_HTTP check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.MULTI_HTTP);
      mockGetMultiHTTPCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetMultiHTTPCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('Ping check', () => {
    it('should call getPingCheckFormValues for PING check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.PING);
      mockGetPingCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetPingCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('Scripted check', () => {
    it('should call getScriptedCheckFormValues for Scripted check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.Scripted);
      mockGetScriptedCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetScriptedCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('TCP check', () => {
    it('should call getTCPCheckFormValues for TCP check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.TCP);
      mockGetTCPCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetTCPCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('Traceroute check', () => {
    it('should call getTracerouteCheckFormValues for Traceroute check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.Traceroute);
      mockGetTracerouteCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetTracerouteCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('Browser check', () => {
    it('should call getBrowserCheckFormValues for Browser check type', () => {
      mockGetCheckType.mockReturnValue(CheckType.Browser);
      mockGetBrowserCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(mockCheck);

      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
      expect(mockGetBrowserCheckFormValues).toHaveBeenCalledWith(mockCheck);
      expect(result).toBe(mockFormValues);
    });
  });

  describe('Unknown check type', () => {
    it('should throw an error for unknown check type', () => {
      const unknownCheckType = 'unknown' as CheckType;
      mockGetCheckType.mockReturnValue(unknownCheckType);

      expect(() => toFormValues(mockCheck)).toThrow(
        `Unable to convert check to form values. Unknown check type: 'unknown'`
      );
      expect(mockGetCheckType).toHaveBeenCalledWith(mockCheck.settings);
    });
  });

  describe('Edge cases', () => {
    it('should handle null or undefined settings gracefully through getCheckType', () => {
      const checkWithoutSettings = { ...mockCheck, settings: undefined };
      // getCheckType should handle undefined settings and return a default
      mockGetCheckType.mockReturnValue(CheckType.HTTP);
      mockGetHTTPCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(checkWithoutSettings);

      expect(mockGetCheckType).toHaveBeenCalledWith(undefined);
      expect(mockGetHTTPCheckFormValues).toHaveBeenCalledWith(checkWithoutSettings);
      expect(result).toBe(mockFormValues);
    });

    it('should handle empty settings object through getCheckType', () => {
      const checkWithEmptySettings = { ...mockCheck, settings: {} };
      // getCheckType should handle empty settings and return a default (HTTP)
      mockGetCheckType.mockReturnValue(CheckType.HTTP);
      mockGetHTTPCheckFormValues.mockReturnValue(mockFormValues);

      const result = toFormValues(checkWithEmptySettings);

      expect(mockGetCheckType).toHaveBeenCalledWith({});
      expect(mockGetHTTPCheckFormValues).toHaveBeenCalledWith(checkWithEmptySettings);
      expect(result).toBe(mockFormValues);
    });
  });
});

describe('toPayload', () => {
  const mockFormValues = {
    checkType: CheckType.HTTP,
    job: 'test-job',
    target: 'https://example.com',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: {},
    probes: [1],
    alertSensitivity: 'none',
    basicMetricsOnly: false,
  } as any;

  const mockCheck = {
    id: 1,
    job: 'test-job',
    target: 'https://example.com',
    frequency: 60000,
    timeout: 3000,
    enabled: true,
    labels: {},
    probes: [1],
    alertSensitivity: 'none',
    basicMetricsOnly: false,
    settings: {
      http: {
        method: 'GET',
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DNS check', () => {
    it('should call getDNSPayload for DNS check type', () => {
      const dnsFormValues = { ...mockFormValues, checkType: CheckType.DNS };
      mockGetDNSPayload.mockReturnValue(mockCheck);

      const result = toPayload(dnsFormValues);

      expect(mockGetDNSPayload).toHaveBeenCalledWith(dnsFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('GRPC check', () => {
    it('should call getGRPCPayload for GRPC check type', () => {
      const grpcFormValues = { ...mockFormValues, checkType: CheckType.GRPC };
      mockGetGRPCPayload.mockReturnValue(mockCheck);

      const result = toPayload(grpcFormValues);

      expect(mockGetGRPCPayload).toHaveBeenCalledWith(grpcFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('HTTP check', () => {
    it('should call getHTTPPayload for HTTP check type', () => {
      const httpFormValues = { ...mockFormValues, checkType: CheckType.HTTP };
      mockGetHTTPPayload.mockReturnValue(mockCheck);

      const result = toPayload(httpFormValues);

      expect(mockGetHTTPPayload).toHaveBeenCalledWith(httpFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('MultiHTTP check', () => {
    it('should call getMultiHTTPPayload for MULTI_HTTP check type', () => {
      const multiHttpFormValues = { ...mockFormValues, checkType: CheckType.MULTI_HTTP };
      mockGetMultiHTTPPayload.mockReturnValue(mockCheck);

      const result = toPayload(multiHttpFormValues);

      expect(mockGetMultiHTTPPayload).toHaveBeenCalledWith(multiHttpFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('Ping check', () => {
    it('should call getPingPayload for PING check type', () => {
      const pingFormValues = { ...mockFormValues, checkType: CheckType.PING };
      mockGetPingPayload.mockReturnValue(mockCheck);

      const result = toPayload(pingFormValues);

      expect(mockGetPingPayload).toHaveBeenCalledWith(pingFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('Scripted check', () => {
    it('should call getScriptedPayload for Scripted check type', () => {
      const scriptedFormValues = { ...mockFormValues, checkType: CheckType.Scripted };
      mockGetScriptedPayload.mockReturnValue(mockCheck);

      const result = toPayload(scriptedFormValues);

      expect(mockGetScriptedPayload).toHaveBeenCalledWith(scriptedFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('TCP check', () => {
    it('should call getTCPPayload for TCP check type', () => {
      const tcpFormValues = { ...mockFormValues, checkType: CheckType.TCP };
      mockGetTCPPayload.mockReturnValue(mockCheck);

      const result = toPayload(tcpFormValues);

      expect(mockGetTCPPayload).toHaveBeenCalledWith(tcpFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('Traceroute check', () => {
    it('should call getTraceroutePayload for Traceroute check type', () => {
      const tracerouteFormValues = { ...mockFormValues, checkType: CheckType.Traceroute };
      mockGetTraceroutePayload.mockReturnValue(mockCheck);

      const result = toPayload(tracerouteFormValues);

      expect(mockGetTraceroutePayload).toHaveBeenCalledWith(tracerouteFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('Browser check', () => {
    it('should call getBrowserPayload for Browser check type', () => {
      const browserFormValues = { ...mockFormValues, checkType: CheckType.Browser };
      mockGetBrowserPayload.mockReturnValue(mockCheck);

      const result = toPayload(browserFormValues);

      expect(mockGetBrowserPayload).toHaveBeenCalledWith(browserFormValues);
      expect(result).toBe(mockCheck);
    });
  });

  describe('Unknown check type', () => {
    it('should throw an error for unknown check type', () => {
      const unknownFormValues = { ...mockFormValues, checkType: 'unknown' as CheckType };

      expect(() => toPayload(unknownFormValues)).toThrow(
        `Unable to convert form values to check. Unknown check type: 'unknown'`
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle form values with undefined checkType', () => {
      const formValuesWithoutCheckType = { ...mockFormValues };
      delete (formValuesWithoutCheckType as any).checkType;

      expect(() => toPayload(formValuesWithoutCheckType)).toThrow(
        `Unable to convert form values to check. Unknown check type: 'undefined'`
      );
    });

    it('should handle form values with null checkType', () => {
      const formValuesWithNullCheckType = { ...mockFormValues, checkType: null as any };

      expect(() => toPayload(formValuesWithNullCheckType)).toThrow(
        `Unable to convert form values to check. Unknown check type: 'null'`
      );
    });
  });
});
