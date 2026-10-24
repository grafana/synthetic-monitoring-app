import React from 'react';
import { trackAddCheckTypeGroupButtonClicked } from 'features/tracking/checkCreationEvents';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { CheckTypeGroup } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { CheckTypeGroupOption, ProtocolOption } from 'hooks/useCheckTypeGroupOptions';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useLimits } from 'hooks/useLimits';
import { CheckStatusInfo } from 'components/CheckStatusInfo';
import { ChoiceTile } from 'components/ChoiceTile';
import { NewStatusBadge } from 'components/NewStatusBadge';

import { FaroUserAction } from '../../../faro';
import { trackFaroUserAction } from '../../../features/tracking/userAction';
import { CHECK_TYPE_GROUP_TILE_COPY, CHECK_TYPE_TILE_COPY } from './tileCopy';

export interface Availability {
  disabled: boolean;
  /** Only set for limits specific to this option; account-wide limits are explained by the page alert. */
  reason?: string;
}

/**
 * Options stay available while limits load, rather than flashing disabled on every visit: they only
 * open the check form, which enforces the same limits before anything can be saved.
 */
export function getGroupAvailability(
  { isOverBrowserLimit, isOverScriptedLimit, isOverCheckLimit, isOverHgExecutionLimit }: ReturnType<typeof useLimits>,
  checkTypeGroup: CheckTypeGroup
): Availability {
  if (isOverCheckLimit || isOverHgExecutionLimit) {
    return { disabled: true };
  }

  if (isOverBrowserLimit && checkTypeGroup === CheckTypeGroup.Browser) {
    return { disabled: true, reason: 'Browser check limit reached' };
  }

  if (isOverScriptedLimit && [CheckTypeGroup.Scripted, CheckTypeGroup.MultiStep].includes(checkTypeGroup)) {
    return { disabled: true, reason: 'Scripted and Multi Step check limit reached' };
  }

  return { disabled: false };
}

type CheckStatus = NonNullable<ReturnType<typeof useCheckTypeOptions>[number]['status']>;

function getStatusAdornment(status?: CheckStatus) {
  if (!status) {
    return undefined;
  }

  return (
    <>
      <NewStatusBadge status={status.value} />
      <CheckStatusInfo {...status} />
    </>
  );
}

export function ProtocolTile({ protocol, availability }: { protocol: ProtocolOption; availability: Availability }) {
  const checkTypeOptions = useCheckTypeOptions();
  const option = checkTypeOptions.find(({ value }) => value === protocol.checkType);
  const copy = protocol.checkType ? CHECK_TYPE_TILE_COPY[protocol.checkType] : undefined;

  if (!protocol.href) {
    return null;
  }

  return (
    <ChoiceTile
      title={protocol.label}
      description={copy?.description ?? option?.description}
      icon={copy?.icon ?? 'heart-rate'}
      href={protocol.href}
      onClick={protocol.onClick}
      disabled={availability.disabled}
      disabledReason={availability.reason}
      adornment={getStatusAdornment(option?.status)}
    />
  );
}

export function GroupTile({ group, availability }: { group: CheckTypeGroupOption; availability: Availability }) {
  const checkTypeOptions = useCheckTypeOptions().filter((option) => option.group === group.value);
  const copy = CHECK_TYPE_GROUP_TILE_COPY[group.value];
  // A group only carries a status badge when every check type in it shares one.
  const status = checkTypeOptions.every((option) => option.status) ? checkTypeOptions[0]?.status : undefined;

  return (
    <ChoiceTile
      data-testid={`${CHECKS_TEST_ID.groupCard}-${group.value}`}
      title={group.label}
      description={copy?.description ?? group.description}
      icon={copy?.icon ?? group.icon}
      href={`${getRoute(AppRoutes.NewCheck)}/${group.value}`}
      onClick={() => {
        trackAddCheckTypeGroupButtonClicked({ checkTypeGroup: group.value });
        trackFaroUserAction(FaroUserAction.SelectCheckTypeClicked, { checkTypeGroup: group.value });
      }}
      disabled={availability.disabled}
      disabledReason={availability.reason}
      adornment={getStatusAdornment(status)}
    />
  );
}
