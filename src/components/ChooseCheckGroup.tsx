import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Badge, Icon, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckTypeGroup, ROUTES } from 'types';
import { CheckTypeGroupOption, ProtocolOption, useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { useLimits } from 'hooks/useLimits';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';
import { Toggletip } from 'components/Toggletip';

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
  const disabled =
    isOverCheckLimit ||
    ([CheckTypeGroup.MultiStep, CheckTypeGroup.Scripted].includes(group.value) && isOverScriptedLimit);

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
          <LinkButton disabled={disabled} href={`${getRoute(ROUTES.NewCheck)}/${group.value}`}>
            Create {group.label} check
          </LinkButton>
        </div>
        <div className={styles.protocols}>
          <Stack direction={`column`}>
            Supported protocols:
            <Stack justifyContent={`center`}>
              {group.protocols.map((protocol) => {
                return <Protocol key={protocol.label} {...protocol} href={disabled ? undefined : protocol.href} />;
              })}
            </Stack>
          </Stack>
        </div>
      </Stack>
    </Card>
  );
};

const BADGE_COLOR = `blue`;

const Protocol = ({ href, label, tooltip }: ProtocolOption) => {
  const styles = useStyles2(getStyles);

  if (tooltip) {
    return (
      <Toggletip content={<div>{tooltip}</div>}>
        <button className={styles.badgeLink}>
          <Badge
            text={
              <Stack gap={0.5} alignItems={`center`}>
                <div>{label}</div>
                <Icon name={`info-circle`} size="sm" />
              </Stack>
            }
            color={BADGE_COLOR}
          />
        </button>
      </Toggletip>
    );
  }

  if (href) {
    return (
      <a className={styles.badgeLink} href={href}>
        <Badge text={label} color={BADGE_COLOR} />
      </a>
    );
  }

  return <Badge text={label} color={BADGE_COLOR} />;
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: `100%`,
    display: `grid`,
    gridTemplateColumns: `repeat(auto-fit, minmax(200px, 400px))`,
    gap: theme.spacing(2),
    textAlign: `center`,
  }),
  badgeLink: css({
    background: `none`,
    border: `none`,
    padding: 0,

    '&:hover': {
      background: theme.colors.emphasize(theme.visualization.getColorByName(BADGE_COLOR), 0.15),
    },
  }),
  desc: css({
    color: theme.colors.text.secondary,
  }),
  protocols: css({
    marginTop: theme.spacing(1),
  }),
});
