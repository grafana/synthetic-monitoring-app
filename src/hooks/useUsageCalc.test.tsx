import React, { PropsWithChildren } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_PING_CHECK, BASIC_TCP_CHECK } from 'test/fixtures/checks';
import { createWrapper } from 'test/render';

import { Check, DnsSettings, HttpSettings, PingSettings, TcpSettings } from 'types';

import { useUsageCalc } from './useUsageCalc';

interface Wrapper {}

const renderUsage = async (check: Check) => {
  const { Wrapper } = createWrapper();

  const wrapper = ({ children }: PropsWithChildren<Wrapper>) => <Wrapper>{children}</Wrapper>;
  const hook = renderHook(() => useUsageCalc(check), { wrapper });

  await waitFor(() => expect(hook.result.current).toBeTruthy());

  return hook;
};

describe('http usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: false,
    });
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 118,
      logsGbPerMonth: 0.04,
      dpm: 118,
    });

    const { result: multipleProbes } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1, 2, 3, 4],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: false,
    });
    expect(multipleProbes.current).toStrictEqual({
      checksPerMonth: 175200,
      activeSeries: 472,
      logsGbPerMonth: 0.14,
      dpm: 472,
    });

    const { result: differentFrequency } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: false,
    });
    expect(differentFrequency.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: 118,
      logsGbPerMonth: 0.21,
      dpm: 708,
    });

    const { result: withSSL } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1],
      settings: {
        http: {
          tlsConfig: {},
        } as HttpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: false,
    });
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: 118,
      logsGbPerMonth: 0.21,
      dpm: 708,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    });

    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 34,
      logsGbPerMonth: 0.04,
      dpm: 34,
    });

    const { result: multipleProbes } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1, 2, 3, 4],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    });
    expect(multipleProbes.current).toStrictEqual({
      checksPerMonth: 175200,
      activeSeries: 136,
      logsGbPerMonth: 0.14,
      dpm: 136,
    });

    const { result: differentFrequency } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1],
      settings: {
        http: {} as HttpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: true,
    });
    expect(differentFrequency.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: 34,
      logsGbPerMonth: 0.21,
      dpm: 204,
    });

    const { result: withSSL } = await renderUsage({
      ...BASIC_HTTP_CHECK,
      probes: [1],
      settings: {
        http: {
          tlsConfig: {},
        } as HttpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: true,
    });
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: 34,
      logsGbPerMonth: 0.21,
      dpm: 204,
    });
  });
});

describe('ping usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_PING_CHECK,
      probes: [1],
      settings: {
        ping: {} as PingSettings,
      },
      frequency: 60000,
      basicMetricsOnly: false,
    });
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 87,
      logsGbPerMonth: 0.04,
      dpm: 87,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_PING_CHECK,
      probes: [1],
      settings: {
        ping: {} as PingSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    });

    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 31,
      logsGbPerMonth: 0.04,
      dpm: 31,
    });
  });
});

describe('tcp usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_TCP_CHECK,
      probes: [1],
      settings: {
        tcp: {} as TcpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: false,
    });
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 37,
      logsGbPerMonth: 0.04,
      dpm: 37,
    });

    const { result: withSSL } = await renderUsage({
      ...BASIC_TCP_CHECK,
      probes: [1],
      settings: {
        tcp: {
          tlsConfig: {},
        } as TcpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: false,
    });
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: 37,
      logsGbPerMonth: 0.21,
      dpm: 222,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_TCP_CHECK,
      probes: [1],
      settings: {
        tcp: {} as TcpSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    });
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 23,
      logsGbPerMonth: 0.04,
      dpm: 23,
    });

    const { result: withSSL } = await renderUsage({
      ...BASIC_TCP_CHECK,
      probes: [1],
      settings: {
        tcp: {
          tlsConfig: {},
        } as TcpSettings,
      },
      frequency: 10000,
      basicMetricsOnly: true,
    });
    expect(withSSL.current).toStrictEqual({
      checksPerMonth: 262800,
      activeSeries: 23,
      logsGbPerMonth: 0.21,
      dpm: 138,
    });
  });
});

describe('dns usage', () => {
  test('calculates with full metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_DNS_CHECK,
      probes: [1],
      settings: {
        dns: {} as DnsSettings,
      },
      frequency: 60000,
      basicMetricsOnly: false,
    });
    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 85,
      logsGbPerMonth: 0.04,
      dpm: 85,
    });
  });

  test('calculates with basic metrics', async () => {
    const { result: basic } = await renderUsage({
      ...BASIC_DNS_CHECK,
      probes: [1],
      settings: {
        dns: {} as DnsSettings,
      },
      frequency: 60000,
      basicMetricsOnly: true,
    });

    expect(basic.current).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 29,
      logsGbPerMonth: 0.04,
      dpm: 29,
    });
  });
});
