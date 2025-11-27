import React, { useCallback } from 'react';
import { LinkButton } from '@grafana/ui';
import { trackAddNewCheckButtonClicked } from 'features/tracking/checkCreationEvents';
import { ACTIONS_TEST_ID } from 'test/dataTestIds';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

interface AddNewCheckButtonProps {
  source: 'check-list-empty-state' | 'check-list' | 'homepage';
}

export function AddNewCheckButton({ source }: AddNewCheckButtonProps) {
  const { canWriteChecks } = getUserPermissions();

  const handleClick = useCallback(() => {
    trackAddNewCheckButtonClicked({ source });
  }, [source]);

  return (
    <LinkButton
      data-testid={ACTIONS_TEST_ID.create.check}
      disabled={!canWriteChecks}
      href={generateRoutePath(AppRoutes.ChooseCheckGroup)}
      icon="plus"
      onClick={handleClick}
      variant="primary"
    >
      Create new check
    </LinkButton>
  );
}
