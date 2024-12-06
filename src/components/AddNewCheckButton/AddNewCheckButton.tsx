import React from 'react';
import { Button } from '@grafana/ui';

import { ROUTES } from 'routing/types';
import { getUserPermissions } from 'data/permissions';
import { useNavigation } from 'hooks/useNavigation';

export function AddNewCheckButton() {
  const navigate = useNavigation();
  const { canWriteChecks } = getUserPermissions();

  return (
    <Button
      variant="primary"
      onClick={() => navigate(ROUTES.ChooseCheckGroup)}
      type="button"
      disabled={!canWriteChecks}
    >
      Add new check
    </Button>
  );
}
