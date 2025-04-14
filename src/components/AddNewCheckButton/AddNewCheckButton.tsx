import React, { useCallback } from 'react';
import { Button } from '@grafana/ui';
import { trackAddNewCheckButtonClicked } from 'features/tracking/checkCreationEvents';

import { ROUTES } from 'routing/types';
import { getUserPermissions } from 'data/permissions';
import { useNavigation } from 'hooks/useNavigation';

interface AddNewCheckButtonProps {
  source: 'check-list' | 'homepage';
}

export function AddNewCheckButton({ source }: AddNewCheckButtonProps) {
  const navigate = useNavigation();
  const { canWriteChecks } = getUserPermissions();

  const handleClick = useCallback(() => {
    trackAddNewCheckButtonClicked({ source });
    navigate(ROUTES.ChooseCheckGroup);
  }, [navigate, source]);

  return (
    <Button variant="primary" onClick={handleClick} type="button" disabled={!canWriteChecks}>
      Add new check
    </Button>
  );
}
