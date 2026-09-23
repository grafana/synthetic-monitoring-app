import React, { PropsWithChildren, useCallback } from 'react';
import { Trans } from '@grafana/i18n';
import { ButtonVariant, LinkButton } from '@grafana/ui';
import { trackAddNewCheckButtonClicked } from 'features/tracking/checkCreationEvents';
import { ACTIONS_TEST_ID } from 'test/dataTestIds';

import { FaroUserAction } from 'faro';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

import { trackFaroUserAction } from '../../features/tracking/userAction';

interface AddNewCheckButtonProps {
  source: 'check-list-empty-state' | 'check-list' | 'homepage';
  fill?: 'solid' | 'outline' | 'text';
  variant?: ButtonVariant;
  hideIcon?: boolean;
}

export function AddNewCheckButton({
  source,
  fill,
  variant = 'primary',
  hideIcon = false,
  children,
}: PropsWithChildren<AddNewCheckButtonProps>) {
  const { canWriteChecks } = getUserPermissions();

  const handleClick = useCallback(() => {
    trackAddNewCheckButtonClicked({ source });
    trackFaroUserAction(FaroUserAction.CreateNewCheckClicked, { source });
  }, [source]);

  return (
    <LinkButton
      data-testid={ACTIONS_TEST_ID.create.check}
      disabled={!canWriteChecks}
      href={generateRoutePath(AppRoutes.ChooseCheckGroup)}
      icon={hideIcon ? undefined : 'plus'}
      onClick={handleClick}
      variant={variant}
      fill={fill}
    >
      {children ?? <Trans i18nKey="addNewCheckButton.createNewCheck">Create new check</Trans>}
    </LinkButton>
  );
}
