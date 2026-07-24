import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { useMeasuredElementHeight, useStickySentinel } from './CheckDashboardLayout.hooks';

function StickyProbe({ rootMarginTopPx }: { rootMarginTopPx: number }) {
  const { sentinelRef, isSticky } = useStickySentinel(rootMarginTopPx);

  return (
    <>
      <div data-testid="sentinel" ref={sentinelRef} />
      <div data-testid="sticky-state">{String(isSticky)}</div>
    </>
  );
}

function MeasuredProbe() {
  const { elementRef, height } = useMeasuredElementHeight<HTMLDivElement>();

  return (
    <>
      <div data-testid="measured-element" ref={elementRef} />
      <output data-testid="measured-height">{height}</output>
    </>
  );
}

describe('useStickySentinel', () => {
  it('marks sticky when the sentinel leaves the intersection root', () => {
    let observerCallback: IntersectionObserverCallback = () => undefined;
    const observe = jest.fn();

    jest.mocked(IntersectionObserver).mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe,
        unobserve: jest.fn(),
        disconnect: jest.fn(),
        takeRecords: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      };
    });

    render(<StickyProbe rootMarginTopPx={48} />);

    expect(observe).toHaveBeenCalledWith(screen.getByTestId('sentinel'));
    expect(screen.getByTestId('sticky-state')).toHaveTextContent('false');

    act(() => {
      observerCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(screen.getByTestId('sticky-state')).toHaveTextContent('true');

    act(() => {
      observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(screen.getByTestId('sticky-state')).toHaveTextContent('false');
  });
});

describe('useMeasuredElementHeight', () => {
  it('measures the border-box height after layout and whenever the element resizes', () => {
    let measuredHeight = 40;
    let resizeCallback: ResizeObserverCallback = () => undefined;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const originalResizeObserver = global.ResizeObserver;

    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          bottom: measuredHeight,
          height: measuredHeight,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    );
    global.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
      resizeCallback = callback;

      return {
        disconnect,
        observe,
        unobserve: jest.fn(),
      };
    }) as unknown as typeof ResizeObserver;

    const { unmount } = render(<MeasuredProbe />);

    expect(screen.getByTestId('measured-height')).toHaveTextContent('40');
    expect(observe).toHaveBeenCalledWith(screen.getByTestId('measured-element'));

    measuredHeight = 56;
    act(() => {
      resizeCallback([], {} as ResizeObserver);
    });

    expect(screen.getByTestId('measured-height')).toHaveTextContent('56');

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);

    global.ResizeObserver = originalResizeObserver;
  });
});
