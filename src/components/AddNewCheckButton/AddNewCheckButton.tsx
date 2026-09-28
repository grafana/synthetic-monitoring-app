import React, { PropsWithChildren, useCallback } from 'react';
import { Trans } from '@grafana/i18n';
import { LinkButton, Tooltip } from '@grafana/ui';
import { trackAddNewCheckButtonClicked } from 'features/tracking/checkCreationEvents';
import { ACTIONS_TEST_ID } from 'test/dataTestIds';

import { FaroUserAction } from 'faro';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

import { trackFaroUserAction } from '../../features/tracking/userAction';

interface AddNewCheckButtonProps {
  source: 'check-list-empty-state' | 'check-list' | 'homepage';
}

const NO_PERMISSION_TOOLTIP = 'You do not have permission to create checks. Contact your administrator for access.';

export function AddNewCheckButton({ source, children }: PropsWithChildren<AddNewCheckButtonProps>) {
  const { canWriteChecks } = getUserPermissions();

  const handleClick = useCallback(() => {
    trackAddNewCheckButtonClicked({ source });
    trackFaroUserAction(FaroUserAction.CreateNewCheckClicked, { source });
  }, [source]);

  const button = (
    <LinkButton
      data-testid={ACTIONS_TEST_ID.create.check}
      disabled={!canWriteChecks}
      href={generateRoutePath(AppRoutes.ChooseCheckGroup)}
      icon="plus"
      onClick={handleClick}
      tooltip={!canWriteChecks ? NO_PERMISSION_TOOLTIP : undefined}
      variant="primary"
    >
      {children ?? <Trans i18nKey="addNewCheckButton.createNewCheck">Create new check</Trans>}
    </LinkButton>
  );

  if (canWriteChecks) {
    return button;
  }

  // Disabled LinkButton is pointer-events: none, so its own `tooltip` prop never fires; the
  // wrapping Tooltip's own hover target (this span) is what actually shows the message.
  return (
    <Tooltip content={NO_PERMISSION_TOOLTIP}>
      <span tabIndex={0} style={{ display: 'inline-flex' }}>
        {button}
      </span>
    </Tooltip>
  );
}
