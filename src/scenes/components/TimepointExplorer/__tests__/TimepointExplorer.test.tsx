// eslint-disable-next-line simple-import-sort/imports
import './TimepointExplorer.mocks';

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { checksLogs1 } from 'test/fixtures/httpCheck/checkLogs';
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

function setupMSWHandlers() {
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
          return { json: checksLogs1(refId) };
        }

        if (refId?.startsWith(REF_ID_EXECUTION_VIEWER_LOGS)) {
          return { json: checksLogs1(refId) };
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
