import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { locationService } from '@grafana/runtime';
import { Button, Modal } from '@grafana/ui';
import { Location, TransitionPromptHook } from 'history';

import { useConfirmBeforeUnload } from 'hooks/useConfirmBeforeUnload';

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

  const handleConfirmLeave = useCallback(() => {
    setShowModal(false);
    setChangesDiscarded(true);
  }, []);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setBlockedLocation(null);
    setChangesDiscarded(false);
  }, []);

  if (showModal) {
    return <ConfirmUnsavedModal onConfirm={handleConfirmLeave} onCancel={handleCancel} />;
  }

  return null;
}

interface ConfirmUnsavedModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmUnsavedModal({ onConfirm, onCancel }: ConfirmUnsavedModalProps) {
  return (
    <Modal isOpen title="Unsaved changes" onDismiss={onCancel}>
      <h5>You have unsaved changes. Are you sure you want to leave this page?</h5>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onCancel} fill="outline">
          Stay on page
        </Button>
        <Button onClick={onConfirm} variant="destructive">
          Leave page
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}
