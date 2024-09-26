import React from 'react';
import { Button } from '@grafana/ui';

import { ROUTES } from 'types';
import { useAtCheckLimit } from 'hooks/useAtCheckLimit';
import { useCanWriteSM } from 'hooks/useDSPermission';
import { useNavigation } from 'hooks/useNavigation';

export function AddNewCheckButton() {
  const navigate = useNavigation();
  const canEdit = useCanWriteSM();
  const { data: atLimit, isLoading } = useAtCheckLimit();

  if (!canEdit) {
    return null;
  }

  return (
    <Button
      icon={isLoading ? 'fa fa-spinner' : undefined}
      disabled={atLimit || isLoading}
      variant="primary"
      onClick={() => navigate(ROUTES.ChooseCheckGroup)}
      type="button"
      tooltip={getTooltip(isLoading, atLimit)}
    >
      Add new check
    </Button>
  );
}

function getTooltip(isLoading: boolean, atLimit: boolean) {
  if (isLoading) {
    return `Checking your plan`;
  }

  if (atLimit) {
    return `You have reached the limit of free checks`;
  }

  return undefined;
}
