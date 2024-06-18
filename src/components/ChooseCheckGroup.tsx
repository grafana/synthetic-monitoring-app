import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Icon, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { ROUTES } from 'types';
import { isOverCheckLimit, isOverScriptedLimit } from 'utils';
import { useChecks } from 'data/useChecks';
import { useTenantLimits } from 'data/useTenantLimits';
import { useCheckTypeGroupOptions } from 'hooks/useCheckTypeGroupOptions';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';

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
          return (
            <Card key={group?.label || ''} className={styles.card} href={`${getRoute(ROUTES.NewCheck)}/${group.value}`}>
              <div className={styles.iconWrapper}>
                <Icon name={group.icon} size="xxxl" />
              </div>
              <Card.Heading className={styles.stack} variant="h6">
                <div>{group.label} </div>
              </Card.Heading>
              <div className={styles.desc}>{group.description}</div>
            </Card>
          );
        })}
      </div>
    </PluginPage>
  );
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
  iconWrapper: css({
    display: `flex`,
    justifyContent: `center`,
    marginBottom: theme.spacing(2),
  }),
});
