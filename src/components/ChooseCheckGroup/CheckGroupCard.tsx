import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckTypeGroup, ROUTES } from 'types';
import { CheckTypeGroupOption } from 'hooks/useCheckTypeGroupOptions';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useLimits } from 'hooks/useLimits';
import { CheckStatusInfo, NewStatusBadge } from 'components/CheckEditor/FormComponents/CheckStatusInfo';
import { getRoute } from 'components/Routing.utils';

import { Card } from '../Card';
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
    <Card key={group.label} data-testid={`${DataTestIds.CHECK_GROUP_CARD}-${group.value}`} className={styles.checkCard}>
      <Stack direction={`column`} justifyContent={`center`} gap={2}>
        <Stack justifyContent={`center`}>
          <Icon name={group.icon} size="xxxl" />
          {shouldShowStatus && checksWithStatus[0].status && (
            <NewStatusBadge status={checksWithStatus[0].status.value} />
          )}
        </Stack>
        <Card.Heading variant="h5" className={styles.cardHeader}>
          <Stack justifyContent={'center'}>
            <div className={styles.groupName}>{group.label}</div>
            {shouldShowStatus && checksWithStatus[0].status && <CheckStatusInfo {...checksWithStatus[0].status} />}
          </Stack>
        </Card.Heading>
        <div className={styles.cardDescription}>{group.description}</div>
        <div>
          <LinkButton
            icon={!isReady ? 'fa fa-spinner' : undefined}
            disabled={disabled}
            href={`${getRoute(ROUTES.NewCheck)}/${group.value}`}
            tooltip={getTooltip(limits, group.value)}
            data-testid={`${group.label} check`}
          >
            {group.label}
          </LinkButton>
        </div>
        <div className={styles.protocols}>
          <Stack direction={`column`} gap={2}>
            <div className={styles.cardFooter}>
              {group.protocols.map((protocol, index) => (
                <span key={protocol.label}>
                  <Protocol {...protocol} href={disabled ? undefined : protocol.href} />
                  {index < group.protocols.length - 1 && ', '}
                </span>
              ))}
            </div>
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
  cardHeader: css({
    maxHeight: '20px',
  }),

  cardDescription: css({
    maxHeight: '70px',
    overflowY: 'scroll',
  }),

  cardFooter: css({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '4px',
    maxHeight: '20px',
  }),

  checkCard: css({
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'wrap',
  }),
  desc: css({
    color: theme.colors.text.secondary,
  }),
  groupName: css({
    color: theme.colors.text.primary,
  }),
  protocols: css({
    marginTop: theme.spacing(1),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    color: theme.colors.text.secondary,
    display: 'flex',
    height: '35px',
    alignItems: 'flex-end',
    justifyContent: 'center',
  }),
});
