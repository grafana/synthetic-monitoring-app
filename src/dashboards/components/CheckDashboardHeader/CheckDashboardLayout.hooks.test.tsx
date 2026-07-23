import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { useStickySentinel } from './CheckDashboardLayout.hooks';

function StickyProbe({ rootMarginTopPx }: { rootMarginTopPx: number }) {
  const { sentinelRef, isSticky } = useStickySentinel(rootMarginTopPx);

  return (
    <>
      <div data-testid="sentinel" ref={sentinelRef} />
      <div data-testid="sticky-state">{String(isSticky)}</div>
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
