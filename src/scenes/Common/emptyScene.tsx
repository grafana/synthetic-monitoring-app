import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { EmbeddedScene, SceneReactObject } from '@grafana/scenes';
import { Button, Card, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType, ROUTES } from 'types';
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
      max-width: 600px;
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
          You don&apos;t have any {checkType ? checkType.toUpperCase() : ''} checks running
        </Card.Heading>
        <Card.Actions className={styles.cardButtons}>
          <Button
            onClick={() => {
              navigate(checkType ? ROUTES.NewCheck + '/' + checkType : ROUTES.ChooseCheckType);
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
