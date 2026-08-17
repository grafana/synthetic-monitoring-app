import React from 'react';
import { screen } from '@testing-library/react';
import { createSMEventFactory } from 'features/tracking/utils';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { CheckType } from 'types';

import { ChecksterProvider, useChecksterContext } from './ChecksterContext';

const trackChecksterScopeProbeEvent = createSMEventFactory('test_feature')('checkster_scope_probe');

const PROBE_EVENT_NAME = 'synthetic-monitoring_test_feature_checkster_scope_probe';

function ContextReady() {
  const { formId } = useChecksterContext();
  return <div data-testid="checkster-ready">{formId}</div>;
}

describe('ChecksterProvider tracking scope', () => {
  const reportInteraction = jest.fn();

  beforeAll(() => {
    jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;
  });

  beforeEach(() => {
    reportInteraction.mockClear();
  });

  async function renderAndGetReportedProps(ui: React.ReactElement) {
    render(ui);
    await screen.findByTestId('checkster-ready');

    trackChecksterScopeProbeEvent();

    const call = reportInteraction.mock.calls.find(([eventName]) => eventName === PROBE_EVENT_NAME);
    return call?.[1];
  }

  it('attaches new-check form scope while creating a check', async () => {
    const props = await renderAndGetReportedProps(
      <ChecksterProvider checkType={CheckType.Scripted}>
        <ContextReady />
      </ChecksterProvider>
    );

    expect(props).toMatchObject({
      check_type: 'scripted',
      check_state: 'new',
      check_is_duplicate: false,
    });
    expect(props).not.toHaveProperty('check_id');
  });

  it('attaches existing-check form scope while editing a check', async () => {
    const props = await renderAndGetReportedProps(
      <ChecksterProvider check={BASIC_HTTP_CHECK}>
        <ContextReady />
      </ChecksterProvider>
    );

    expect(props).toMatchObject({
      check_type: 'http',
      check_state: 'existing',
      check_id: BASIC_HTTP_CHECK.id,
      check_is_duplicate: false,
    });
  });

  it('reports duplicated checks as new with the duplicate flag', async () => {
    // the duplicate flow strips the source check id before handing it to the provider
    // (see useDuplicateCheck), which is what makes the duplicate count as new
    const props = await renderAndGetReportedProps(
      <ChecksterProvider check={{ ...BASIC_HTTP_CHECK, id: undefined }} isDuplicate>
        <ContextReady />
      </ChecksterProvider>
    );

    expect(props).toMatchObject({
      check_type: 'http',
      check_state: 'new',
      check_is_duplicate: true,
    });
  });
});
