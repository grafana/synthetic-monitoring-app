import React, { useState } from 'react';

import { css } from '@emotion/css';
import { Card, useStyles2, VerticalGroup } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { CheckType, CheckFormValues, FeatureName, ROUTES } from 'types';
import { CHECK_TYPE_OPTIONS } from 'components/constants';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';

export function ChooseCheckType() {
  const styles = useStyles2(getStyles);
  const { isEnabled: tracerouteEnabled } = useFeatureFlag(FeatureName.Traceroute);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  // If we're editing, grab the appropriate check from the list
  const [selectedCheckType, setSelectedCheckType] = useState<CheckFormValues['checkType']>();
  const navigate = useNavigation();

  const options = !tracerouteEnabled
    ? CHECK_TYPE_OPTIONS.filter(({ value }) => value !== CheckType.Traceroute)
    : !multiHttpEnabled
    ? CHECK_TYPE_OPTIONS.filter(({ value }) => value !== CheckType.MULTI_HTTP)
    : CHECK_TYPE_OPTIONS;

  React.useEffect(() => {
    selectedCheckType && navigate(`${ROUTES.NewCheck}/${selectedCheckType.value}`, {}, false, selectedCheckType);
  });

  return (
    <div className={styles.container}>
      <h2>Choose check type</h2>
      <VerticalGroup>
        {options?.map((check) => {
          return (
            <Card
              key={check?.label || ''}
              className={styles.cards}
              onClick={() => {
                setSelectedCheckType(check);
              }}
            >
              <Card.Heading>{check.label}</Card.Heading>
            </Card>
          );
        })}
      </VerticalGroup>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    justify-content: space-between;
    width: 50vw;
    margin: ${theme.spacing(3)};
    padding: ${theme.spacing(2)};
    place-items: center;
    align-items: center;
    justify-content: center;
  `,
  cards: css`
    width: 100%;
    margin: ${theme.spacing(1)};
  `,
});
