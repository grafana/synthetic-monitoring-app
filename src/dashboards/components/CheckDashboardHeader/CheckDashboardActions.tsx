import React, { ComponentProps, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, ConfirmModal, Stack } from '@grafana/ui';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useDeleteCheck, useUpdateCheck } from 'data/useChecks';
import { EditCheckButton } from 'scenes/Common/EditCheckButton';

interface CheckDashboardActionsProps {
  check: Check;
  size?: ComponentProps<typeof Button>['size'];
}

export function CheckDashboardActions({ check, size = 'md' }: CheckDashboardActionsProps) {
  const { canWriteChecks, canDeleteChecks } = getUserPermissions();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: updateCheck, isPending: isUpdating } = useUpdateCheck();
  const { mutate: deleteCheck, isPending: isDeleting } = useDeleteCheck({
    onSuccess: () => {
      navigate(getRoute(AppRoutes.Checks));
    },
  });

  const handleToggleEnabled = useCallback(() => {
    updateCheck({ ...check, enabled: !check.enabled });
  }, [check, updateCheck]);

  const pauseLabel = check.enabled ? 'Pause' : 'Resume';

  return (
    <Stack direction="row" gap={0.5} alignItems="center">
      <Button
        aria-label={pauseLabel}
        tooltip={pauseLabel}
        variant="primary"
        icon={isUpdating ? 'fa fa-spinner' : check.enabled ? 'pause' : 'play'}
        size={size}
        onClick={handleToggleEnabled}
        disabled={!canWriteChecks || isUpdating || isDeleting}
      />
      <EditCheckButton id={check.id} size={size} iconOnly />
      <Button
        aria-label="Delete"
        tooltip="Delete"
        variant="destructive"
        icon="trash-alt"
        size={size}
        onClick={() => setShowDeleteModal(true)}
        disabled={!canDeleteChecks || isUpdating || isDeleting}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete check"
        body="Are you sure you want to delete this check?"
        confirmText="Delete check"
        onConfirm={() => {
          deleteCheck(check);
          setShowDeleteModal(false);
        }}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </Stack>
  );
}
