import React, { PropsWithChildren } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { CheckInfo } from 'test/fixtures/checks';
import { createWrapper } from 'test/render';

import { Check, DnsSettings, HttpSettings, PingSettings, TcpSettings } from 'types';
import { checkToUsageCalcValues } from 'utils';

import { useUsageCalc } from './useUsageCalc';

interface Wrapper {}

const renderUsage = async (check: Check) => {
  const { Wrapper } = createWrapper();

  const wrapper = ({ children }: PropsWithChildren<Wrapper>) => <Wrapper>{children}</Wrapper>;
  const hook = renderHook(() => useUsageCalc([checkToUsageCalcValues(check)]), { wrapper });

  await waitFor(() => expect(hook.result.current).toBeTruthy());

  return hook;
};

const {
  dns,
  dns_basic,
  http,
  http_ssl,
  http_ssl_basic,
  http_basic,
  ping,
  ping_basic,
  tcp,
  tcp_basic,
  tcp_ssl,
  tcp_ssl_basic,
} = CheckInfo.AccountingClasses;

describe('http usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
    } as Check);
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: http.Series,
      logsGbPerMonth: 0.04,
      dpm: 118,
    });

    const { result: multipleProbes } = await renderUsage({
      probes: [1, 2, 3, 4],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
    } as Check);
    expect(multipleProbes.current).toStrictEqual({
      checksPerMonth: 175200,
      activeSeries: 472,
      logsGbPerMonth: 0.14,
      dpm: 472,
    });

    const { result: differentFrequency } = await renderUsage({
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 10000,
    } as Check);
    expect(differentFrequency.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: http.Series,
      logsGbPerMonth: 0.21,
      dpm: 708,
    });

    const { result: withSSL } = await renderUsage({
      probes: [1],
      settings: {
        http: {
          tlsConfig: {
            serverName: `trigger SSL`,
          },
        } as HttpSettings,
      },
      frequency: 10000,
    } as Check);
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: http_ssl.Series,
      logsGbPerMonth: 0.21,
      dpm: 732,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    } as Check);

    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 34,
      logsGbPerMonth: 0.04,
      dpm: 34,
    });

    const { result: multipleProbes } = await renderUsage({
      probes: [1, 2, 3, 4],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    } as Check);
    expect(multipleProbes.current).toStrictEqual({
      checksPerMonth: 175200,
      activeSeries: 136,
      logsGbPerMonth: 0.14,
      dpm: 136,
    });

    const { result: differentFrequency } = await renderUsage({
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: true,
    } as Check);
    expect(differentFrequency.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: http_basic.Series,
      logsGbPerMonth: 0.21,
      dpm: 204,
    });

    const { result: withSSL } = await renderUsage({
      probes: [1],
      settings: {
        http: {
          tlsConfig: {
            serverName: `trigger SSL`,
          },
        } as HttpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: true,
    } as Check);
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: http_ssl_basic.Series,
      logsGbPerMonth: 0.21,
      dpm: 228,
    });
  });
});

describe('ping usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        ping: {} as PingSettings,
      },
      frequency: 60000,
    } as Check);
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: ping.Series,
      logsGbPerMonth: 0.04,
      dpm: 87,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        ping: {} as PingSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    } as Check);

    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: ping_basic.Series,
      logsGbPerMonth: 0.04,
      dpm: 31,
    });
  });
});

describe('tcp usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        tcp: {},
      },
      frequency: 60000,
    } as Check);
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: tcp.Series,
      logsGbPerMonth: 0.04,
      dpm: 37,
    });

    const { result: withSSL } = await renderUsage({
      probes: [1],
      settings: {
        tcp: {
          tlsConfig: {
            serverName: `trigger SSL`,
          },
        },
      },
      frequency: 10000,
    } as Check);
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: tcp_ssl.Series,
      logsGbPerMonth: 0.21,
      dpm: 246,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        tcp: {},
      },
      frequency: 60000,
      basicMetricsOnly: true,
    } as Check);
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: tcp_basic.Series,
      logsGbPerMonth: 0.04,
      dpm: 23,
    });

    const { result: withSSL } = await renderUsage({
      probes: [1],
      settings: {
        tcp: {
          tlsConfig: {
            serverName: `trigger SSL`,
          },
        } as TcpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: true,
    } as Check);
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: tcp_ssl_basic.Series,
      logsGbPerMonth: 0.21,
      dpm: 162,
    });
  });
});

describe('dns usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        dns: {} as DnsSettings,
      },
      frequency: 60000,
    } as Check);
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: dns.Series,
      logsGbPerMonth: 0.04,
      dpm: 85,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      probes: [1],
      settings: {
        dns: {} as DnsSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    } as Check);

    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: dns_basic.Series,
      logsGbPerMonth: 0.04,
      dpm: 29,
    });
  });
});
