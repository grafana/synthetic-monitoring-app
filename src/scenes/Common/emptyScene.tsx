import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { EmbeddedScene, SceneReactObject } from '@grafana/scenes';
import { Button, Card, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';
import { ROUTES } from 'routing/types';
import { useNavigation } from 'hooks/useNavigation';

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 100%;
    `,
    cardHeader: css`
      text-align: center;
      justify-content: center;
    `,
    emptyCard: css`
      min-height: 200px;
      max-width: 800px;
      padding: ${theme.spacing(4)};
    `,
    cardButtons: css`
      display: flex;
      justify-content: center;
    `,
  };
}

function EmptyScene({ checkType }: { checkType?: CheckType }) {
  const styles = useStyles2(getStyles);
  const navigate = useNavigation();

  return (
    <div className={styles.container}>
      <Card className={styles.emptyCard}>
        <Card.Heading className={styles.cardHeader}>
          <p>
            You don&apos;t have any {checkType ? checkType.toUpperCase() : ''} checks running. Click the Create a check
            button to start monitoring your services with Grafana Cloud, or{' '}
            <TextLink href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/" external={true}>
              check out the Synthetic Monitoring docs.
            </TextLink>
          </p>
        </Card.Heading>
        <Card.Actions className={styles.cardButtons}>
          <Button
            onClick={() => {
              navigate(checkType ? ROUTES.NewCheck + '/' + checkType : ROUTES.ChooseCheckGroup);
            }}
          >
            Create a check
          </Button>
        </Card.Actions>
      </Card>
    </div>
  );
}

export function getEmptyScene(checkType?: CheckType) {
  return new EmbeddedScene({
    body: new SceneReactObject({
      component: EmptyScene,
      props: { checkType },
    }),
  });
}
