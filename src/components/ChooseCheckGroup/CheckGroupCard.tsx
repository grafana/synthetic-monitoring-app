import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckTypeGroup, ROUTES } from 'types';
import { CheckTypeGroupOption } from 'hooks/useCheckTypeGroupOptions';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useLimits } from 'hooks/useLimits';
import { getRoute } from 'components/Routing.utils';

import { Card } from '../Card';
import { CheckStatusBadge } from '../CheckEditor/FormComponents/CheckStatusBadge';
import { Protocol } from './Protocol';

export const CheckGroupCard = ({ group }: { group: CheckTypeGroupOption }) => {
  const styles = useStyles2(getStyles);
  const limits = useLimits();
  const { isReady } = limits;
  const checkOptions = useCheckTypeOptions().filter((option) => option.group === group.value);
  const checksWithStatus = checkOptions.filter((option) => option.status);
  const shouldShowStatus = checksWithStatus.length === checkOptions.length;

  const tooltip = getTooltip(limits, group.value);
  const disabled = Boolean(tooltip);

  return (
    <Card key={group.label} data-testid={`${DataTestIds.CHECK_GROUP_CARD}-${group.value}`}>
      <Stack direction={`column`} justifyContent={`center`} gap={2}>
        <Stack justifyContent={`center`}>
          <Icon name={group.icon} size="xxxl" />
        </Stack>
        <Card.Heading variant="h6">
          <div>{group.label} </div>
        </Card.Heading>
        <div className={styles.desc}>{group.description}</div>
        <div>
          <LinkButton
            icon={!isReady ? 'fa fa-spinner' : undefined}
            disabled={disabled}
            href={`${getRoute(ROUTES.NewCheck)}/${group.value}`}
            tooltip={getTooltip(limits, group.value)}
          >
            {group.label} check
          </LinkButton>
        </div>
        <div className={styles.protocols}>
          <Stack direction={`column`} gap={2}>
            Supported protocols:
            <Stack justifyContent={`center`}>
              {group.protocols.map((protocol) => {
                return <Protocol key={protocol.label} {...protocol} href={disabled ? undefined : protocol.href} />;
              })}
            </Stack>
            {shouldShowStatus && checksWithStatus[0].status && (
              <Stack justifyContent={`center`}>
                <CheckStatusBadge {...checksWithStatus[0].status} />
              </Stack>
            )}
          </Stack>
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
  desc: css({
    color: theme.colors.text.secondary,
  }),
  protocols: css({
    marginTop: theme.spacing(1),
  }),
});
