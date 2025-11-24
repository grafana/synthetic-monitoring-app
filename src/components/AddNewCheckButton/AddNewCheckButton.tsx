import React, { useCallback } from 'react';
import { LinkButton } from '@grafana/ui';
import { trackAddNewCheckButtonClicked } from 'features/tracking/checkCreationEvents';
import { ACTIONS_TEST_ID } from 'test/dataTestIds';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

interface AddNewCheckButtonProps {
  source: 'check-list' | 'homepage';
}

export function AddNewCheckButton({ source }: AddNewCheckButtonProps) {
  const { canWriteChecks } = getUserPermissions();

  const handleClick = useCallback(() => {
    trackAddNewCheckButtonClicked({ source });
  }, [source]);

  return (
    <LinkButton
      data-testid={ACTIONS_TEST_ID.create.check}
      variant="primary"
      onClick={handleClick}
      href={generateRoutePath(AppRoutes.ChooseCheckGroup)}
      disabled={!canWriteChecks}
    >
      Add new check
    </LinkButton>
  );
}
