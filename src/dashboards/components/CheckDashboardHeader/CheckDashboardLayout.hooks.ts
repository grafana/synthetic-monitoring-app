import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function useMeasuredElementHeight<T extends HTMLElement>() {
  const elementRef = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { elementRef, height };
}

/**
 * Detects when a following `position: sticky` sibling has engaged.
 * Place the returned sentinel immediately above the sticky element and match
 * `rootMarginTopPx` to that element's sticky `top` offset.
 */
export function useStickySentinel(rootMarginTopPx: number) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        rootMargin: `-${rootMarginTopPx}px 0px 0px 0px`,
        threshold: [0],
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [rootMarginTopPx]);

  return { sentinelRef, isSticky };
}
