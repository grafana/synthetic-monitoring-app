import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Badge, BadgeColor, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckStatus, CheckType, ROUTES } from 'types';
import { isOverCheckLimit, isOverScriptedLimit } from 'utils';
import { useChecks } from 'data/useChecks';
import { useTenantLimits } from 'data/useTenantLimits';
import { useCheckTypeOptions } from 'hooks/useCheckTypeOptions';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';

import { Card } from './Card';
import { ErrorAlert } from './ErrorAlert';

export function ChooseCheckType() {
  const styles = useStyles2(getStyles);
  const { data: checks, isLoading: checksLoading } = useChecks();
  const { data: limits, isLoading: limitsLoading } = useTenantLimits();
  const nav = useNavigation();
  const checkTypeOptions = useCheckTypeOptions();

  if (checksLoading || limitsLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  const overScriptedLimit = isOverScriptedLimit({ checks, limits });
  const overTotalLimit = isOverCheckLimit({ checks, limits });

  const options = checkTypeOptions.filter(({ value }) => {
    if (overScriptedLimit && (value === CheckType.MULTI_HTTP || value === CheckType.Scripted)) {
      return false;
    }

    return true;
  });

  if (overTotalLimit) {
    return (
      <PluginPage layout={PageLayoutType?.Standard} pageNav={{ text: 'Choose a check type' }}>
        <ErrorAlert
          title="Check limit reached"
          content={`You have reached the limit of checks you can create. Your current limit is ${limits?.MaxChecks}. You can delete existing checks or upgrade your plan to create more. Please contact support if you've reached this limit in error.`}
          buttonText={'Back to checks'}
          onClick={() => {
            nav(ROUTES.Checks);
          }}
        />
      </PluginPage>
    );
  }
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
      <div className={styles.container} data-testid={DataTestIds.CHOOSE_CHECK_TYPE}>
        {options.map((check) => {
          return (
            <Card key={check?.label || ''} className={styles.card} href={`${getRoute(ROUTES.NewCheck)}/${check.value}`}>
              <Card.Heading className={styles.stack} variant="h6">
                <div>{check.label} </div>

                {check.status && <CheckBadge status={check.status} />}
              </Card.Heading>
              <div className={styles.desc}>{check.description}</div>
            </Card>
          );
        })}
      </div>
    </PluginPage>
  );
}

const colorMap: Record<CheckStatus, { text: string; color: BadgeColor }> = {
  [CheckStatus.EXPERIMENTAL]: {
    color: 'orange',
    text: `Experimental`,
  },
  [CheckStatus.PUBLIC_PREVIEW]: {
    color: 'blue',
    text: `Public preview`,
  },
};

const CheckBadge = ({ status }: { status: CheckStatus }) => {
  const { text, color } = colorMap[status];

  return <Badge text={text} color={color} />;
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: `100%`,
    margin: theme.spacing(2, 0),
    padding: theme.spacing(2),
    display: `grid`,
    gridTemplateColumns: `repeat(auto-fit, minmax(200px, 400px))`,
    gap: theme.spacing(2),
  }),
  card: css({
    ':hover': {
      cursor: 'pointer',
      background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
    },
  }),
  desc: css({
    color: theme.colors.text.secondary,
  }),
  stack: css({
    display: `flex`,
    gap: theme.spacing(1),
    alignItems: `center`,
    justifyContent: `center`,
  }),
});
