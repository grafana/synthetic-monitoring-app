import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Badge, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType, FeatureName, ROUTES } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { Card } from 'components/Card';
import { CHECK_TYPE_OPTIONS } from 'components/constants';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';

export function ChooseCheckType() {
  const styles = useStyles2(getStyles);
  const { isEnabled: scriptedEnabled } = useFeatureFlag(FeatureName.ScriptedChecks);
  // If we're editing, grab the appropriate check from the list

  const options = CHECK_TYPE_OPTIONS.filter(({ value }) => {
    if (!scriptedEnabled && value === CheckType.Scripted) {
      return false;
    }
    return true;
  });

  return (
    <PluginPage layout={PageLayoutType?.Standard} pageNav={{ text: 'Choose a check type' }}>
      <div className={styles.container}>
        {options?.map((check) => {
          return (
            <Card key={check?.label || ''} className={styles.card} href={`${getRoute(ROUTES.NewCheck)}/${check.value}`}>
              <Card.Heading className={styles.heading} variant="h6">
                {check.label}
                {check.value === CheckType.Scripted && (
                  <Badge text="Public preview" color="blue" className={styles.experimentalBadge} />
                )}
              </Card.Heading>
              <div className={styles.desc}>{check.description}</div>
            </Card>
          );
        })}
      </div>
    </PluginPage>
  );
}

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
  heading: css({
    textAlign: `center`,
    justifyContent: `center`,
    alignItems: `flex-start`,
  }),
  desc: css({
    color: theme.colors.text.secondary,
  }),
  experimentalBadge: css({
    marginLeft: theme.spacing(1),
  }),
});
