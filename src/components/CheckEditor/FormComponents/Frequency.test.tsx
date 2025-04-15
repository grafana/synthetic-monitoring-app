import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { render } from 'test/render';

import { CheckType } from 'types';
import { formatDuration } from 'utils';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';
import { Frequency } from 'components/CheckEditor/FormComponents/Frequency';
import { FREQUENCY_OPTIONS } from 'components/CheckEditor/FormComponents/Frequency.constants';

interface RenderWrapperProps {
  disabled?: boolean;
  frequency: number;
  checkType: CheckType;
}

function RenderWrapper(props: RenderWrapperProps) {
  const form = useForm({
    defaultValues: {
      frequency: props.frequency || ONE_MINUTE_IN_MS,
    },
  });

  return (
    <FormProvider {...form}>
      <Frequency checkType={props.checkType || CheckType.HTTP} disabled={props.disabled} />
    </FormProvider>
  );
}

async function renderFrequency(props?: any) {
  const result = render(<RenderWrapper {...props} />);
  await waitFor(() => screen.findByTestId(DataTestIds.FREQUENCY_COMPONENT), { timeout: 3000 });

  return result;
}

describe('Frequency', () => {
  it(`should render the basic tab when the value is an option in the basic list`, async () => {
    await renderFrequency();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it(`should render the custom tab when the value is not an option in the basic list`, async () => {
    await renderFrequency({ frequency: ONE_SECOND_IN_MS });
    expect(screen.getByRole('tab', { name: 'Custom' })).toHaveAttribute('aria-selected', 'true');
  });

  it(`should be disabled when disabled prop is true`, async () => {
    await renderFrequency({ disabled: true });

    FREQUENCY_OPTIONS.forEach((option) => {
      expect(screen.getByRole('radio', { name: formatDuration(option, true) })).toBeDisabled();
    });
  });

  describe('Checktype rendering is correct', () => {
    it.each([CheckType.DNS, CheckType.GRPC, CheckType.HTTP, CheckType.TCP, CheckType.PING])(
      'renders the correct options for %s',
      async (checkType) => {
        await renderFrequency({ checkType });
        [`10s`, `30s`, `1m`, `2m`, `3m`, `5m`, `10m`, `15m`, `30m`, `1h`].forEach((option) => {
          expect(screen.getByText(option)).toBeInTheDocument();
        });
      }
    );

    it.each([CheckType.DNS, CheckType.GRPC, CheckType.HTTP, CheckType.TCP, CheckType.PING])(
      'renders the correct min and max frequency for %s',
      async (checkType) => {
        await renderFrequency({ checkType, frequency: ONE_SECOND_IN_MS });
        expect(screen.getByText('Minimum frequency: 10 seconds')).toBeInTheDocument();
        expect(screen.getByText('Maximum frequency: 1 hour')).toBeInTheDocument();
      }
    );

    it.each([CheckType.Browser, CheckType.MULTI_HTTP, CheckType.Scripted])(
      'renders the correct options for %s',
      async (checkType) => {
        await renderFrequency({ checkType });
        [`1m`, `2m`, `3m`, `5m`, `10m`, `15m`, `30m`, `1h`].forEach((option) => {
          expect(screen.getByText(option)).toBeInTheDocument();
        });

        [`10s`, `30s`].forEach((option) => {
          expect(screen.queryByText(option)).not.toBeInTheDocument();
        });
      }
    );

    it.each([CheckType.Browser, CheckType.MULTI_HTTP, CheckType.Scripted])(
      'renders the correct min and max frequency for %s',
      async (checkType) => {
        await renderFrequency({ checkType, frequency: ONE_SECOND_IN_MS });
        expect(screen.getByText('Minimum frequency: 1 minute')).toBeInTheDocument();
        expect(screen.getByText('Maximum frequency: 1 hour')).toBeInTheDocument();
      }
    );

    it(`renders the correct options for ${CheckType.Traceroute}`, async () => {
      await renderFrequency({ checkType: CheckType.Traceroute });
      [`2m`, `3m`, `5m`, `10m`, `15m`, `30m`, `1h`].forEach((option) => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });

      [`10s`, `30s`, `1m`].forEach((option) => {
        expect(screen.queryByText(option)).not.toBeInTheDocument();
      });
    });

    it(`renders the correct min and max frequency for ${CheckType.Traceroute}`, async () => {
      await renderFrequency({ checkType: CheckType.Traceroute, frequency: ONE_SECOND_IN_MS });
      expect(screen.getByText('Minimum frequency: 2 minutes')).toBeInTheDocument();
      expect(screen.getByText('Maximum frequency: 1 hour')).toBeInTheDocument();
    });
  });
});
