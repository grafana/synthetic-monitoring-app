// eslint-disable-next-line simple-import-sort/imports
import './TimepointExplorer.mocks';

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { checksLogs1 } from 'test/fixtures/httpCheck/checkLogs';
import { createExecutionLogsResponse } from 'test/fixtures/httpCheck/executionLogsResponse';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import {
  createUniqueConfigFrame,
  createUniqueConfigsResponse,
  createMaxProbeDurationFrame,
  createMaxProbeDurationResponse,
} from 'test/fixtures/httpCheck/promUniqueConfigs';

import { TimepointExplorer } from 'scenes/components/TimepointExplorer/TimepointExplorer';
import { SCENES_TEST_ID } from 'test/dataTestIds';
import { mockFeatureToggles } from 'test/utils';
import { FeatureName, HTTPCheck } from 'types';
import {
  REF_ID_EXECUTION_LIST_LOGS,
  REF_ID_EXECUTION_VIEWER_LOGS,
  REF_ID_MAX_PROBE_DURATION,
  REF_ID_UNIQUE_CHECK_CONFIGS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

const baseTime = Date.now();

const TIME_MODIFIED_HTTP_CHECK: HTTPCheck = {
  ...BASIC_HTTP_CHECK,
  frequency: 60000,
  timeout: 10000,
  created: Math.floor((baseTime - 60 * 60 * 1000) / 1000),
  modified: Math.floor((baseTime - 10 * 60 * 1000) / 1000),
};

function setupMSWHandlers(executionLogs: (refId: string) => object = checksLogs1) {
  server.use(
    apiRoute('getHttpDashboard', {
      result: async (req) => {
        const url = new URL(req.url);
        const refId = url.searchParams.get('refId');

        if (refId === REF_ID_UNIQUE_CHECK_CONFIGS) {
          const frame = createUniqueConfigFrame({
            configVersion: String((baseTime - 360000) * 1_000_000),
            frequency: '60000',
            timestamps: [baseTime - 360000],
            values: [1],
          });

          return {
            json: createUniqueConfigsResponse([frame]),
          };
        }

        if (refId === REF_ID_MAX_PROBE_DURATION) {
          const frame = createMaxProbeDurationFrame({
            refId: REF_ID_MAX_PROBE_DURATION,
            job: BASIC_HTTP_CHECK.job,
            instance: BASIC_HTTP_CHECK.target,
            probe: 'atlanta',
            timestamps: [baseTime],
            values: [2.5],
          });

          return {
            json: createMaxProbeDurationResponse(REF_ID_MAX_PROBE_DURATION, [frame]),
          };
        }

        if (refId?.startsWith(REF_ID_EXECUTION_LIST_LOGS)) {
          return { json: executionLogs(refId) };
        }

        if (refId?.startsWith(REF_ID_EXECUTION_VIEWER_LOGS)) {
          return { json: executionLogs(refId) };
        }

        return { json: { results: {} } };
      },
    })
  );
}



function renderTimepointExplorer() {
  return <TimepointExplorer check={TIME_MODIFIED_HTTP_CHECK} />;
}

const mockScrollIntoView = jest.fn();

describe('TimepointExplorer', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = mockScrollIntoView;
    jest.spyOn(Date, 'now').mockReturnValue(baseTime);
    setupMSWHandlers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`should not render if the feature flag is off`, async () => {
    render(renderTimepointExplorer());
    await waitFor(() => screen.queryByTestId(SCENES_TEST_ID.timepoint.list));
    expect(screen.queryByTestId(SCENES_TEST_ID.timepoint.list)).not.toBeInTheDocument();
    expect(screen.queryByTestId(SCENES_TEST_ID.timepoint.viewer)).not.toBeInTheDocument();
  });

  it('should render if the feature flag is on', async () => {
    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    render(renderTimepointExplorer());
    await waitFor(() => screen.findByTestId(SCENES_TEST_ID.timepoint.list));
    await waitFor(() => screen.findByTestId(SCENES_TEST_ID.timepoint.viewer));
  });

  it(`should call scrollIntoView when a timepoint with data is clicked`, async () => {
    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    const { user } = render(renderTimepointExplorer());

    expect(mockScrollIntoView).not.toHaveBeenCalled();

    const timepointButtons = await screen.findAllByTestId(new RegExp(`${SCENES_TEST_ID.timepoint.listEntryBar}-`));

    await user.click(timepointButtons[0]);

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  describe(`partial failures in uptime view`, () => {
    const frequency = TIME_MODIFIED_HTTP_CHECK.frequency;
    // in jsdom the list has no width, so only the latest timepoint is visible — target that one
    const latestTimepointTime = baseTime - (baseTime % frequency);
    const logTime = latestTimepointTime + 1000;

    function setupExecutionLogs(logs: Array<{ probe: string; probeSuccess: '0' | '1' }>) {
      setupMSWHandlers((refId) =>
        createExecutionLogsResponse(refId, {
          job: TIME_MODIFIED_HTTP_CHECK.job,
          instance: TIME_MODIFIED_HTTP_CHECK.target,
          logs: logs.map((log) => ({ ...log, time: logTime })),
        })
      );
    }

    it(`should render a failure segment proportional to the failed executions when some (but not all) probes fail`, async () => {
      mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });

      setupExecutionLogs([
        { probe: PRIVATE_PROBE.name, probeSuccess: '1' },
        { probe: PUBLIC_PROBE.name, probeSuccess: '0' },
      ]);

      render(renderTimepointExplorer());

      const failureSegments = await screen.findAllByTestId(
        new RegExp(`${SCENES_TEST_ID.timepoint.listEntryFailureSegment}-`)
      );

      expect(failureSegments).toHaveLength(1);
      expect(failureSegments[0]).toHaveStyle({ height: `${(1 / 2) * 100}%` });
      // the bar swaps its success tick for a warning icon (Icon is mocked as <svg name="..." /> in tests)
      expect(failureSegments[0].parentElement?.querySelector('svg[name="exclamation-triangle"]')).toBeInTheDocument();
    });

    it(`should keep showing a partially failed bar when filtering on failures`, async () => {
      mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });

      setupExecutionLogs([
        { probe: PRIVATE_PROBE.name, probeSuccess: '1' },
        { probe: PUBLIC_PROBE.name, probeSuccess: '0' },
      ]);

      const { user } = render(renderTimepointExplorer());

      await screen.findAllByTestId(new RegExp(`${SCENES_TEST_ID.timepoint.listEntryFailureSegment}-`));

      // filter down to failures only via the viz legend
      await user.click(screen.getByRole('button', { name: 'failure' }));

      expect(
        await screen.findByTestId(new RegExp(`${SCENES_TEST_ID.timepoint.listEntryFailureSegment}-`))
      ).toBeInTheDocument();
    });

    it(`should not render a failure segment when all probes succeed`, async () => {
      mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });

      setupExecutionLogs([
        { probe: PRIVATE_PROBE.name, probeSuccess: '1' },
        { probe: PUBLIC_PROBE.name, probeSuccess: '1' },
      ]);

      render(renderTimepointExplorer());

      // wait for the success tick so we know the logs have been mapped to the timepoint
      await waitFor(() => expect(document.querySelector('svg[name="check"]')).toBeInTheDocument());

      expect(
        screen.queryByTestId(new RegExp(`${SCENES_TEST_ID.timepoint.listEntryFailureSegment}-`))
      ).not.toBeInTheDocument();
    });

    it(`should not render a failure segment when all probes fail`, async () => {
      mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });

      setupExecutionLogs([
        { probe: PRIVATE_PROBE.name, probeSuccess: '0' },
        { probe: PUBLIC_PROBE.name, probeSuccess: '0' },
      ]);

      render(renderTimepointExplorer());

      // wait for the failure cross so we know the logs have been mapped to the timepoint
      await waitFor(() => expect(document.querySelector('svg[name="times"]')).toBeInTheDocument());

      expect(
        screen.queryByTestId(new RegExp(`${SCENES_TEST_ID.timepoint.listEntryFailureSegment}-`))
      ).not.toBeInTheDocument();
    });
  });

  it(`should attach the explorer's tracking scope to feedback events fired inside it`, async () => {
    const reportInteraction = jest.fn();
    jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;

    mockFeatureToggles({ [FeatureName.TimepointExplorer]: true });
    const { user } = render(renderTimepointExplorer());
    await waitFor(() => screen.findByTestId(SCENES_TEST_ID.timepoint.list));

    await user.click(screen.getByRole('button', { name: 'I love this feature' }));

    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_feature_feedback_feature_feedback_submitted',
      expect.objectContaining({
        feature: 'timepoint-explorer',
        reaction: 'good',
        tpe_view_mode: 'uptime',
        tpe_visible_timepoints: expect.any(Number),
        tpe_total_timepoints: expect.any(Number),
        tpe_page: 0,
        tpe_section: 0,
      })
    );
  });
});
