import React from 'react';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { Badge, Card, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType, FeatureName, ROUTES } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';
import { CHECK_TYPE_OPTIONS } from 'components/constants';
import { PluginPage } from 'components/PluginPage';

export function ChooseCheckType() {
  const styles = useStyles2(getStyles);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  const { isEnabled: scriptedEnabled } = useFeatureFlag(FeatureName.ScriptedChecks);
  // If we're editing, grab the appropriate check from the list
  const navigate = useNavigation();

  const options = CHECK_TYPE_OPTIONS.filter(({ value }) => {
    if (!multiHttpEnabled && value === CheckType.MULTI_HTTP) {
      return false;
    }
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
            <Card
              key={check?.label || ''}
              className={styles.cards}
              onClick={() => {
                navigate(`${ROUTES.NewCheck}/${check.value}`);
              }}
            >
              <Card.Heading className={styles.cardsHeader}>
                {check.label}
                {check.value === CheckType.MULTI_HTTP && (
                  <Badge text="Public preview" color="blue" className={styles.experimentalBadge} />
                )}
                {check.value === CheckType.Scripted && (
                  <Badge text="Experimental" color="orange" className={styles.experimentalBadge} />
                )}
              </Card.Heading>
              <Card.Description>{check.description}</Card.Description>
            </Card>
          );
        })}
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
    margin: ${theme.spacing(2)} 0;
    padding: ${theme.spacing(2)};
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 400px));
    gap: ${theme.spacing(2)};
  `,
  cards: css`
    max-width: 400px;
  `,
  cardsHeader: css`
    text-align: center;
    justify-content: center;
    align-items: flex-start;
  `,
  experimentalBadge: css`
    margin-left: ${theme.spacing(1)};
  `,
});
