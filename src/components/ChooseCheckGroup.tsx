import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Icon, LinkButton, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckTypeGroup, ROUTES } from 'types';
import { CheckTypeGroupOption, ProtocolOption, useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useLimits } from 'hooks/useLimits';
import { getRoute } from 'components/Routing.utils';
import { Toggletip } from 'components/Toggletip';

import { CheckStatusInfo, NewStatusBadge } from './CheckEditor/FormComponents/CheckStatusInfo';
import { Card } from './Card';
import { OverLimitAlert } from './OverLimitAlert';

export const ChooseCheckGroup = () => {
  const styles = useStyles2(getStyles);
  const options = useCheckTypeGroupOptions();

  return (
    <PluginPage layout={PageLayoutType.Standard} pageNav={{ text: 'Choose a check type' }}>
      <Stack direction={`column`} gap={2}>
        <div>
          Pick between {options.length} different types of checks to monitor your services. Choose the one that best
          fits your needs.
        </div>
        <OverLimitAlert />
        <div className={styles.container} data-testid={DataTestIds.CHOOSE_CHECK_TYPE}>
          {options.map((group) => {
            return <CheckGroupCard key={group.label} group={group} />;
          })}
        </div>
      </Stack>
    </PluginPage>
  );
};

const CheckGroupCard = ({ group }: { group: CheckTypeGroupOption }) => {
  const styles = useStyles2(getStyles);
  const { isOverCheckLimit, isOverScriptedLimit } = useLimits();
  const checkOptions = useCheckTypeOptions().filter((option) => option.group === group.value);
  const checksWithStatus = checkOptions.filter((option) => option.status);
  const shouldShowStatus = checksWithStatus.length === checkOptions.length;

  const disabled =
    isOverCheckLimit ||
    ([CheckTypeGroup.MultiStep, CheckTypeGroup.Scripted].includes(group.value) && isOverScriptedLimit);

  return (
    <Card key={group.label} data-testid={`${DataTestIds.CHECK_GROUP_CARD}-${group.value}`}>
      <Stack direction={`column`} justifyContent={`center`} gap={2}>
        <Stack justifyContent={`center`}>
          <Icon name={group.icon} size="xxxl" />
          {shouldShowStatus && checksWithStatus[0].status && (
            <NewStatusBadge status={checksWithStatus[0].status.value} />
          )}
        </Stack>
        <Card.Heading variant="h5">
          <Stack justifyContent={'center'}>
            <div className={styles.groupName}>{group.label}</div>
            {shouldShowStatus && checksWithStatus[0].status && <CheckStatusInfo {...checksWithStatus[0].status} />}
          </Stack>
        </Card.Heading>
        <div>{group.description}</div>
        <div>
          <LinkButton disabled={disabled} href={`${getRoute(ROUTES.NewCheck)}/${group.value}`}>
            {group.label}
          </LinkButton>
        </div>
        <div className={styles.protocols}>
          <Stack direction={`column`} gap={2}>
            <Stack justifyContent={`center`} alignItems={'center'}>
              {group.protocols.map((protocol, index) => (
                <span key={protocol.label}>
                  <Protocol {...protocol} href={disabled ? undefined : protocol.href} />
                  {index < group.protocols.length - 1 && ', '}
                </span>
              ))}
            </Stack>
          </Stack>
        </div>
      </Stack>
    </Card>
  );
};

const Protocol = ({ href, label, tooltip }: ProtocolOption) => {
  const styles = useStyles2(getStyles);

  if (tooltip) {
    return (
      <Toggletip content={<div>{tooltip}</div>}>
        <div className={styles.badgeLink}>
          <Stack gap={0.5} alignItems={`center`}>
            <span>{label}</span>
            <Icon name={`info-circle`} size="sm" />
          </Stack>
        </div>
      </Toggletip>
    );
  }

  if (href) {
    return (
      <TextLink className={styles.badgeLink} href={href} inline={false} color="secondary">
        {label}
      </TextLink>
    );
  }

  return <span>{label}</span>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: `100%`,
    display: `grid`,
    gridTemplateColumns: `repeat(auto-fit, minmax(200px, 400px))`,
    gap: theme.spacing(2),
    textAlign: `center`,
    color: theme.colors.text.secondary,
  }),
  badgeLink: css({
    background: `none`,
    border: `none`,
    padding: 0,
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
