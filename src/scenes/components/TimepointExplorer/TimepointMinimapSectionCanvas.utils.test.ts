import { MIN_PARTIAL_FAILURE_HEIGHT_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  StatefulTimepoint,
  TimepointStatus,
  TimepointVizOption,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { drawUptimeTimepoint } from 'scenes/components/TimepointExplorer/TimepointMinimapSectionCanvas.utils';

function createCtx() {
  return {
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  };
}

const vizOption: TimepointVizOption = {
  border: '#00ff00',
  backgroundColor: '#00ff0033',
  textColor: '#fff',
  statusColor: '#00ff00',
};

const vizOptionColors: Record<TimepointStatus, TimepointVizOption> = {
  success: vizOption,
  failure: {
    ...vizOption,
    border: '#ff0000',
    backgroundColor: '#ff000033',
    statusColor: '#ff0000',
  },
  missing: vizOption,
  pending: vizOption,
};

function createTimepoint(overrides: Partial<StatefulTimepoint> = {}): StatefulTimepoint {
  return {
    adjustedTime: 0,
    timepointDuration: 60000,
    status: 'success',
    probeResults: {},
    maxProbeDuration: 1000,
    failureRatio: 0,
    index: 0,
    config: { frequency: 60000, from: 0, to: 60000 },
    ...overrides,
  };
}

describe(`drawUptimeTimepoint`, () => {
  it(`should keep the success outline when the bar has a partial failure`, () => {
    const ctx = createCtx();

    drawUptimeTimepoint({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      statefulTimepoint: createTimepoint({ failureRatio: 0.1 }),
      x: 0,
      width: 8,
      canvasHeight: 40,
      yAxisMax: 1000,
      vizDisplay: ['success', 'failure'],
      vizOptionColors,
    });

    expect(ctx.strokeRect).toHaveBeenCalledWith(0, 0, 8, 40);
    expect(ctx.strokeRect.mock.invocationCallOrder[0]).toBeGreaterThan(ctx.stroke.mock.invocationCallOrder[0]);
  });

  it(`should clip the hatch to a visible minimum when the failure ratio is very small`, () => {
    const ctx = createCtx();

    drawUptimeTimepoint({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      statefulTimepoint: createTimepoint({ failureRatio: 0.02 }),
      x: 0,
      width: 8,
      canvasHeight: 40,
      yAxisMax: 1000,
      vizDisplay: ['success', 'failure'],
      vizOptionColors,
    });

    expect(ctx.rect).toHaveBeenCalledWith(0, 40 - MIN_PARTIAL_FAILURE_HEIGHT_PX, 8, MIN_PARTIAL_FAILURE_HEIGHT_PX);
    const centerOffset = (8 - MIN_PARTIAL_FAILURE_HEIGHT_PX) / 2;
    expect(ctx.moveTo).toHaveBeenCalledWith(centerOffset, 40);
    expect(ctx.lineTo).toHaveBeenCalledWith(centerOffset + MIN_PARTIAL_FAILURE_HEIGHT_PX, 36);
  });
});
