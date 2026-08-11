import { useEffect, useState } from 'react';
import { registerTrackingScope, TrackingEventProps, unregisterTrackingScope } from 'features/tracking/utils';

/**
 * Attaches the given props to every tracking event fired while the calling component is
 * mounted, so events carry the context of the feature the user is inside (e.g. which
 * check they are viewing). Props are kept current across re-renders and removed on
 * unmount.
 *
 * Concurrently mounted scopes must use disjoint prop namespaces (`check_*`,
 * `time_range_*`, `tpe_*`, ...): collision order between scopes follows effect timing
 * (child effects run before parent effects) and is not a supported semantic. Explicit
 * event props always win over scope props on key collision.
 */
export function useTrackingScope(props: TrackingEventProps) {
  const [id] = useState(() => Symbol('tracking-scope'));

  // no dependency array on purpose: registration is a cheap map write with no
  // subscribers, so pushing the latest props after every render keeps them current
  // without needing memoized props at call sites
  useEffect(() => {
    registerTrackingScope(id, props);
  });

  useEffect(() => {
    return () => {
      unregisterTrackingScope(id);
    };
  }, [id]);
}
