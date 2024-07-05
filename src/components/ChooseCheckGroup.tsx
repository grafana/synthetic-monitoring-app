import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Badge, Icon, LinkButton, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { ROUTES } from 'types';
import { isOverCheckLimit, isOverScriptedLimit } from 'utils';
import { useChecks } from 'data/useChecks';
import { useTenantLimits } from 'data/useTenantLimits';
import { CheckTypeGroupOption, ProtocolOption, useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';
import { Toggletip } from 'components/Toggletip';

import { Card } from './Card';
import { ErrorAlert } from './ErrorAlert';

export const ChooseCheckGroup = () => {
  const styles = useStyles2(getStyles);
  const { data: checks, isLoading: checksLoading } = useChecks();
  const { data: limits, isLoading: limitsLoading } = useTenantLimits();
  const nav = useNavigation();
  const options = useCheckTypeGroupOptions();

  if (checksLoading || limitsLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  const overScriptedLimit = isOverScriptedLimit({ checks, limits });
  const overTotalLimit = isOverCheckLimit({ checks, limits });
  console.log(overTotalLimit); // TODD - wire this up
  return (
    <PluginPage layout={PageLayoutType?.Standard} pageNav={{ text: 'Choose a check type' }}>
      {overScriptedLimit && (
        <ErrorAlert
          title="Scripted check limit reached"
          content={`You have reached the limit of scripted and multiHTTP checks you can create. Your current limit is ${limits?.MaxScriptedChecks}. You can delete existing scripted checks or upgrade your plan to create more. Please contact support if you've reached this limit in error.`}
          buttonText={'Back to checks'}
          onClick={() => {
            nav(ROUTES.Checks);
          }}
        />
      )}
      <div>
        Pick between {options.length} different types of checks to monitor your services. Choose the one that best fits
        your needs.
      </div>
      <div className={styles.container} data-testid={DataTestIds.CHOOSE_CHECK_TYPE}>
        {options.map((group) => {
          return <CheckGroupCard key={group.label} group={group} />;
        })}
      </div>
    </PluginPage>
  );
};

const CheckGroupCard = ({ group }: { group: CheckTypeGroupOption }) => {
  const styles = useStyles2(getStyles);

  return (
    <Card key={group.label}>
      <Stack direction={`column`} justifyContent={`center`} gap={2}>
        <Stack justifyContent={`center`}>
          <Icon name={group.icon} size="xxxl" />
        </Stack>
        <Card.Heading variant="h6">
          <div>{group.label} </div>
        </Card.Heading>
        <div className={styles.desc}>{group.description}</div>
        <div>
          <LinkButton href={`${getRoute(ROUTES.NewCheck)}/${group.value}`}>Create {group.label} check</LinkButton>
        </div>
        <div className={styles.protocols}>
          <Stack direction={`column`}>
            Supported protocols:
            <Stack justifyContent={`center`}>
              {group.protocols.map((protocol) => {
                return <Protocol key={protocol.label} {...protocol} />;
              })}
            </Stack>
          </Stack>
        </div>
      </Stack>
    </Card>
  );
};

const Protocol = ({ href, label, tooltip }: ProtocolOption) => {
  const styles = useStyles2(getStyles);
  const content = <Badge text={label} color={`blue`} />;
  console.log({ href, label, tooltip });

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
            color={`blue`}
          />
        </button>
      </Toggletip>
    );
  }

  if (href) {
    return (
      <a className={styles.badgeLink} href={href}>
        {content}
      </a>
    );
  }

  return content;
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: `100%`,
    margin: theme.spacing(2, 0),
    padding: theme.spacing(2),
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
      background: theme.colors.emphasize(theme.visualization.getColorByName('blue'), 0.15),
    },
  }),
  desc: css({
    color: theme.colors.text.secondary,
  }),
  protocols: css({
    marginTop: theme.spacing(1),
  }),
});
