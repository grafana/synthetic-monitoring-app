import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { renderHook, screen, waitFor } from '@testing-library/react';
import { PROBES_TEST_ID } from 'test/dataTestIds';
import { OFFLINE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckFormValues, CheckType } from 'types';
import { PROBE_REFETCH_INTERVAL } from 'data/useProbes';

import { ProbeOptions } from './ProbeOptions';

interface RenderWrapperProps {
  checkType: CheckType;
  onChange: (probes: number[]) => void;
  selectedProbes: number[];
  onlyProbes?: boolean;
}

function RenderWrapper(props: RenderWrapperProps) {
  const form = useForm<CheckFormValues>({
    defaultValues: {
      checkType: props.checkType,
    },
  });

  return (
    <FormProvider {...form}>
      <ProbeOptions {...props} />
    </FormProvider>
  );
}

describe('ProbeOptions', () => {
  it('updates the probe status after the refresh interval', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    server.use(
      apiRoute('listProbes', {
        result: () => {
          return {
            json: [OFFLINE_PROBE],
          };
        },
      })
    );

    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
    const offlineColor = result.current.colors.error.text;
    const onlineColor = result.current.colors.success.text;

    render(<RenderWrapper onlyProbes checkType={CheckType.HTTP} onChange={() => {}} selectedProbes={[]} />);
    const offlineStatus = await screen.findByTestId(PROBES_TEST_ID.cards.status);
    expect(offlineStatus).toHaveStyle(`background-color: ${offlineColor}`);

    server.use(
      apiRoute('listProbes', {
        result: () => {
          return {
            json: [
              {
                ...OFFLINE_PROBE,
                online: true,
              },
            ],
          };
        },
      })
    );

    jest.advanceTimersByTime(PROBE_REFETCH_INTERVAL);

    await waitFor(async () => {
      jest.advanceTimersByTime(0);
      const onlineStatus = await screen.findByTestId(PROBES_TEST_ID.cards.status);
      expect(onlineStatus).toHaveStyle(`background-color: ${onlineColor}`);
    });

    jest.useRealTimers();
  });
});
