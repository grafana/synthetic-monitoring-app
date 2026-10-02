import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackAddCheckTypeGroupButtonClicked } from 'features/tracking/checkCreationEvents';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { CheckTypeGroup } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { CheckTypeGroupOption } from 'hooks/useCheckTypeGroupOptions';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useLimits } from 'hooks/useLimits';
import { Card } from 'components/Card';
import { CheckStatusInfo } from 'components/CheckStatusInfo';
import { NewStatusBadge } from 'components/NewStatusBadge';

import { FaroUserAction } from '../../../faro';
import { trackFaroUserAction } from '../../../features/tracking/userAction';
import { Protocol } from './Protocol';

const CHECK_GROUP_BUTTON_LABELS: Record<CheckTypeGroup, string> = {
  [CheckTypeGroup.ApiTest]: 'API Endpoint',
  [CheckTypeGroup.MultiStep]: 'Multi Step',
  [CheckTypeGroup.Scripted]: 'Scripted',
  [CheckTypeGroup.Browser]: 'Browser',
};

export const CheckGroupCard = ({ group }: { group: CheckTypeGroupOption }) => {
  const styles = useStyles2(getStyles);
  const limits = useLimits();
  const { isReady } = limits;
  const checkOptions = useCheckTypeOptions().filter((option) => option.group === group.value);
  const checksWithStatus = checkOptions.filter((option) => option.status);
  const shouldShowStatus = checksWithStatus.length === checkOptions.length;
  const buttonLabel = CHECK_GROUP_BUTTON_LABELS[group.value];

  const tooltip = getTooltip(limits, group.value);
  const disabled = Boolean(tooltip);

  return (
    <Card key={group.label} className={styles.checkCard} data-testid={`${CHECKS_TEST_ID.groupCard}-${group.value}`}>
      <Stack alignItems="flex-start" direction="column" gap={1.5}>
        <Stack alignItems="center" direction="row" gap={1} wrap="wrap">
          <Icon name={group.icon} size="lg" />
          <Card.Heading variant="h5">
            <span className={styles.groupName}>{group.label}</span>
          </Card.Heading>
          {shouldShowStatus && checksWithStatus[0].status && (
            <>
              <NewStatusBadge status={checksWithStatus[0].status.value} />
              <CheckStatusInfo {...checksWithStatus[0].status} />
            </>
          )}
        </Stack>
        <Text color="secondary">{group.description}</Text>
        <div className={styles.footer}>
          <div className={styles.protocols}>
            {group.protocols.map((protocol) => (
              <Protocol
                key={protocol.label}
                {...protocol}
                href={disabled ? undefined : protocol.href}
                onClick={protocol.onClick}
              />
            ))}
          </div>
          <LinkButton
            disabled={disabled}
            href={`${getRoute(AppRoutes.NewCheck)}/${group.value}`}
            icon={!isReady ? 'fa fa-spinner' : undefined}
            tooltip={tooltip}
            variant="primary"
            onClick={() => {
              trackAddCheckTypeGroupButtonClicked({ checkTypeGroup: group.value });
              trackFaroUserAction(FaroUserAction.SelectCheckTypeClicked, { checkTypeGroup: group.value });
            }}
          >
            {buttonLabel}
            {isReady && <Icon name="arrow-right" />}
          </LinkButton>
        </div>
      </Stack>
    </Card>
  );
};

function getTooltip(
  {
    isReady,
    isOverBrowserLimit,
    isOverScriptedLimit,
    isOverCheckLimit,
    isOverHgExecutionLimit,
  }: ReturnType<typeof useLimits>,
  checkTypeGroup: CheckTypeGroup
) {
  if (!isReady) {
    return `Checking your plan`;
  }

  if (isOverCheckLimit) {
    return `You have reached the limit of your checks`;
  }

  if (isOverHgExecutionLimit) {
    return `You have reached the limit of your check executions`;
  }

  if (isOverBrowserLimit && checkTypeGroup === CheckTypeGroup.Browser) {
    return `You have reached the limit of your Browser checks`;
  }

  if (isOverScriptedLimit && [CheckTypeGroup.Scripted, CheckTypeGroup.MultiStep].includes(checkTypeGroup)) {
    return `You have reached the limit of your Scripted and Multi Step checks`;
  }

  return undefined;
}

const getStyles = (theme: GrafanaTheme2) => ({
  checkCard: css({
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'wrap',
    textAlign: 'left',

    '> div:first-of-type': {
      height: '100%',
    },
  }),
  groupName: css({
    color: theme.colors.text.primary,
  }),
  footer: css({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1.5),
    width: '100%',
  }),
  protocols: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing(0.5),
  }),
});
