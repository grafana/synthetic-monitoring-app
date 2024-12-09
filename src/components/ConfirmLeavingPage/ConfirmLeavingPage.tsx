import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { locationService } from '@grafana/runtime';
import { Location, TransitionPromptHook } from 'history';

import { useConfirmBeforeUnload } from 'hooks/useConfirmBeforeUnload';

import { ConfirmUnsavedModal } from './ConfirmUnsavedModal';

interface ConfirmLeavingPageProps {
  enabled: boolean;
}

/**
 * When enabled is `true`, will block `react-router-dom` navigation with confirm modal.
 * Native navigations are handled with native `confirm`
 *
 * @example
 *  <ConfirmLeavingPage enabled={formHasUnsavedFields} />
 *
 * @see {useConfirmBeforeUnload}
 * @param {boolean} enabled Whether or not to actively block transitions
 * @constructor
 */
export function ConfirmLeavingPage({ enabled }: ConfirmLeavingPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [blockedLocation, setBlockedLocation] = useState<Location | null>(null);
  const [changesDiscarded, setChangesDiscarded] = useState(false);
  const navigate = useNavigate();
  const history = locationService.getHistory();
  useConfirmBeforeUnload(enabled);

  const location = useLocation();

  const blockHandler: TransitionPromptHook = useCallback(
    (nextLocation: Location) => {
      const path = location.pathname;
      const nextPath = nextLocation.pathname;

      // Check all the reasons to allow navigation
      if (!enabled || path === nextPath || changesDiscarded) {
        return;
      }

      setBlockedLocation(nextLocation);
      setShowModal(true);
      return false;
    },
    [changesDiscarded, enabled, location.pathname]
  );

  useEffect(() => {
    const unblock = history.block(blockHandler);

    return () => {
      unblock();
    };
  }, [blockHandler, blockedLocation, history]);

  useEffect(() => {
    if (changesDiscarded && blockedLocation) {
      navigate(blockedLocation.pathname);
    }
  }, [blockedLocation, changesDiscarded, navigate]);

  const handleLeavePage = useCallback(() => {
    setShowModal(false);
    setChangesDiscarded(true);
  }, []);

  const handleStayOnPage = useCallback(() => {
    setShowModal(false);
    setBlockedLocation(null);
    setChangesDiscarded(false);
  }, []);

  if (showModal) {
    return <ConfirmUnsavedModal onLeavePage={handleLeavePage} onStayOnPage={handleStayOnPage} />;
  }

  return null;
}
