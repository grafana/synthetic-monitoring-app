import React from 'react';
import { config } from '@grafana/runtime';
import { screen, within } from '@testing-library/react';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { getSelect, probeToMetadataProbe, selectOption } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

const renderCheckList = async (checks = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK], searchParams = '') => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: checks,
        };
      },
    })
  );

  const path = `${generateRoutePath(AppRoutes.Checks)}?${searchParams}`;

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path,
  });

  expect(await screen.findByText('Add new check')).toBeInTheDocument();
  return res;
};

function getModalContainer() {
  return document.body.querySelector(`[role="dialog"]`) as HTMLElement;
}

describe('CheckList - Filtering', () => {
  test('clicking label value adds to label filter', async () => {
    const { user } = await renderCheckList();
    const label = BASIC_DNS_CHECK.labels[0];
    const constructedLabel = `${label.name}: ${label.value}`;
    const labelValue = await screen.findAllByText(constructedLabel);
    await user.click(labelValue[0]);
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    const dialog = getModalContainer();
    expect(within(dialog).getByText(constructedLabel)).toBeInTheDocument();
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('filters by check type', async () => {
    const { user } = await renderCheckList();
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    await selectOption(user, { label: 'Filter by type', option: 'HTTP' });
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('filters by probe', async () => {
    const DNS_CHECK_WITH_REMOVED_PROBE: Check = {
      ...BASIC_DNS_CHECK,
      probes: [PUBLIC_PROBE.id] as number[],
    };

    const { user } = await renderCheckList([DNS_CHECK_WITH_REMOVED_PROBE, BASIC_HTTP_CHECK]);
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);
    const probeFilter = await screen.findByLabelText('Filter by probe');
    await user.click(probeFilter);
    await user.click(screen.getByText(probeToMetadataProbe(PRIVATE_PROBE).displayName, { selector: 'span' }));

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('loads status filter from query params', async () => {
    const DNS_CHECK_DISABLED = {
      ...BASIC_DNS_CHECK,
      enabled: false,
    };

    const { user } = await renderCheckList([DNS_CHECK_DISABLED, BASIC_HTTP_CHECK], 'status=disabled');
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    const dialog = getModalContainer();
    const statusFilter = await within(dialog).findByText('Disabled');
    expect(statusFilter).toBeInTheDocument();
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('loads type filter from query params', async () => {
    const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK], 'type=http');
    const additionalFilters = await screen.findByText(/Additional filters \(1 active\)/i);
    await user.click(additionalFilters);

    const dialog = getModalContainer();
    const typeFilter = await within(dialog).findByText('HTTP', { exact: false });
    expect(typeFilter).toBeInTheDocument();

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('scripted checks appear in the filters', async () => {
    const { user } = await renderCheckList();
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    const select = await getSelect({ label: `Filter by type` });
    await user.click(select[0]);
    const listBox = screen.getByLabelText(`Select options menu`);

    expect(within(listBox).getByText(`Scripted`)).toBeInTheDocument();
  });

  test('gRPC checks do not appear in the filters by default', async () => {
    const { user } = await renderCheckList();
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    const select = await getSelect({ label: `Filter by type` });
    await user.click(select[0]);
    const listBox = screen.getByLabelText(`Select options menu`);

    expect(within(listBox).queryByText(`gRPC`)).not.toBeInTheDocument();
  });

  test('gRPC checks appear in the filters when the feature flag is enabled', async () => {
    jest.replaceProperty(config, 'featureToggles', {
      // @ts-expect-error
      [FeatureName.GRPCChecks]: true,
    });

    const { user } = await renderCheckList();
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    const select = await getSelect({ label: `Filter by type` });
    await user.click(select[0]);
    const listBox = screen.getByLabelText(`Select options menu`);

    expect(within(listBox).getByText(`gRPC`)).toBeInTheDocument();
  });

  test('clicking filters reset button works correctly', async () => {
    const DNS_CHECK_DISABLED = {
      ...BASIC_DNS_CHECK,
      enabled: false,
    };

    const { user } = await renderCheckList([DNS_CHECK_DISABLED, BASIC_HTTP_CHECK]);
    const disabledChiclet = await screen.findAllByText('Disabled');
    await user.click(disabledChiclet[0]);
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    const dialog = getModalContainer();
    const statusFilter = await within(dialog).findByText(`Disabled`);
    expect(statusFilter).toBeInTheDocument();

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);

    await user.click(await within(dialog).findByText(`Reset`));
    const resetChecks = await screen.findAllByTestId('check-card');
    expect(resetChecks.length).toBe(2);
  });

  test('loads labels from query params', async () => {
    const label = BASIC_DNS_CHECK.labels[0];
    const constructedLabel = `${label.name}: ${label.value}`;

    const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK], `labels=${constructedLabel}`);
    const additionalFilters = await screen.findByText(/Additional filters \(1 active\)/i);
    await user.click(additionalFilters);

    const dialog = getModalContainer();
    const typeFilter = await within(dialog).findByText(constructedLabel, { exact: false });
    expect(typeFilter).toBeInTheDocument();

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('loads probes from query params', async () => {
    const constructedLabel = PRIVATE_PROBE.name;

    const { user } = await renderCheckList(
      [
        {
          ...BASIC_DNS_CHECK,
          probes: [PRIVATE_PROBE.id!],
        },
        {
          ...BASIC_HTTP_CHECK,
          probes: [PUBLIC_PROBE.id!],
        },
      ],
      `probes=${constructedLabel}`
    );
    const additionalFilters = await screen.findByText(/Additional filters \(1 active\)/i);
    await user.click(additionalFilters);

    const dialog = getModalContainer();
    const typeFilter = await within(dialog).findByText(constructedLabel, { exact: false });
    expect(typeFilter).toBeInTheDocument();

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('clicking type chiclet adds it to filter', async () => {
    const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
    const httpTypeChiclet = await screen.findAllByText('HTTP');
    await user.click(httpTypeChiclet[0]);
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);
    const checks = await screen.findAllByTestId('check-card');

    const dialog = getModalContainer();
    const typeFilter = await within(dialog).findByText(`HTTP`);
    expect(typeFilter).toBeInTheDocument();

    expect(checks.length).toBe(1);
  });

  test('clicking status chiclet adds it to filter', async () => {
    const DNS_CHECK_DISABLED = {
      ...BASIC_DNS_CHECK,
      enabled: false,
    };

    const { user } = await renderCheckList([DNS_CHECK_DISABLED, BASIC_HTTP_CHECK]);
    const disabledChiclet = await screen.findAllByText('Disabled');
    await user.click(disabledChiclet[0]);
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);

    const dialog = getModalContainer();
    const statusFilter = await within(dialog).findByText(`Disabled`);
    expect(statusFilter).toBeInTheDocument();

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('cascader adds labels to label filter', async () => {
    const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
    const additionalFilters = await screen.findByText(/Additional filters/i);
    await user.click(additionalFilters);
    const cascader = await screen.findByText('Labels');
    await user.click(cascader);
    const labelMenuItems = await screen.findAllByLabelText('Select check');
    expect(labelMenuItems.length).toBe(2);
    const labelName = await screen.findByText(BASIC_DNS_CHECK.labels[0].name);
    await user.click(labelName);
    const labelValue = await screen.findByText(BASIC_DNS_CHECK.labels[0].value);
    await user.click(labelValue);

    const constructedLabel = `${BASIC_DNS_CHECK.labels[0].name}: ${BASIC_DNS_CHECK.labels[0].value}`;
    const dialog = getModalContainer();
    const labelFilterInput = await within(dialog).findByText(constructedLabel);

    expect(labelFilterInput).toBeInTheDocument();
  });
});
