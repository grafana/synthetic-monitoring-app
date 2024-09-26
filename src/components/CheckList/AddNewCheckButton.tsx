import React from 'react';
import { Button } from '@grafana/ui';

import { ROUTES } from 'types';
import { useCanWriteSM } from 'hooks/useDSPermission';
import { useNavigation } from 'hooks/useNavigation';

export function AddNewCheckButton() {
  const navigate = useNavigation();
  const canEdit = useCanWriteSM();

  if (!canEdit) {
    return null;
  }

  return (
    <Button variant="primary" onClick={() => navigate(ROUTES.ChooseCheckGroup)} type="button">
      Add new check
    </Button>
  );
}
