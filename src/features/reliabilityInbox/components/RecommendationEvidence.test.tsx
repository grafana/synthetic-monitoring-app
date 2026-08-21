import React from 'react';
import { FieldType, toDataFrame } from '@grafana/data';
import { screen } from '@testing-library/react';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';
import { render } from 'test/render';

import { useRecommendationTelemetry } from '../data';
import { toReliabilityOpportunity } from '../model';
import { RecommendationEvidence, selectTrendSparkline } from './RecommendationEvidence';

jest.mock('../data', () => ({
  ...jest.requireActual('../data'),
  useRecommendationTelemetry: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(useRecommendationTelemetry).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isLoading: false,
  } as unknown as ReturnType<typeof useRecommendationTelemetry>);
});

describe('RecommendationEvidence', () => {
  it('labels every trend with the query start and end times', async () => {
    const { user } = render(
      <RecommendationEvidence
        opportunity={toReliabilityOpportunity(HTTP_RELIABILITY_SUGGESTION)}
        headerContent={<span>Suggested check</span>}
      />
    );

    await user.click(await screen.findByRole('button', { name: 'Why this check?' }));

    expect(screen.getAllByText('10:00')).toHaveLength(3);
    expect(screen.getAllByText('11:00')).toHaveLength(3);
    expect(screen.queryByText('60m ago')).not.toBeInTheDocument();
    expect(screen.queryByText('Now')).not.toBeInTheDocument();
  });
});

describe('RecommendationEvidence trend selection', () => {
  it('uses a renderable range frame instead of an instant frame with the same refId', () => {
    const instantFrame = toDataFrame({
      refId: 'A',
      fields: [
        { name: 'Time', type: FieldType.time, values: [1784804400000] },
        { name: 'Requests per second', type: FieldType.number, values: [11.4] },
      ],
    });
    const rangeFrame = toDataFrame({
      refId: 'A',
      fields: [
        { name: 'Time', type: FieldType.time, values: [1784800800000, 1784802600000, 1784804400000] },
        { name: 'Requests per second', type: FieldType.number, values: [10.8, 11.7, 11.4] },
      ],
    });

    const sparkline = selectTrendSparkline([instantFrame, rangeFrame], 'A');

    expect(sparkline?.y.values).toEqual([10.8, 11.7, 11.4]);
    expect(sparkline?.y.state?.range).toEqual({ min: 10.8, max: 11.7, delta: expect.closeTo(0.9) });
    expect(sparkline?.x?.values).toEqual([1784800800000, 1784802600000, 1784804400000]);
  });

  it('does not present a one-point instant value as a trend', () => {
    const instantFrame = toDataFrame({
      refId: 'A',
      fields: [
        { name: 'Time', type: FieldType.time, values: [1784804400000] },
        { name: 'Requests per second', type: FieldType.number, values: [11.4] },
      ],
    });

    expect(selectTrendSparkline([instantFrame], 'A')).toBeUndefined();
  });
});
