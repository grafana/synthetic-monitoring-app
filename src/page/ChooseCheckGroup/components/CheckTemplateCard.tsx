import React from 'react';
import { Icon, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { CheckTypeGroup } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { Card } from 'components/Card';

export function CheckTemplateCard() {
  const styles = useStyles2(getStyles);
  const href = `${getRoute(AppRoutes.NewCheck)}/${CheckTypeGroup.Browser}`;

  return (
    <Card className={styles.card} data-testid={CHECKS_TEST_ID.templateCard} href={href}>
      <Stack alignItems="flex-start" direction="column" gap={1}>
        <Stack alignItems="center" direction="row" gap={1}>
          <Icon name="link-broken" size="lg" />
          <Card.Heading variant="h5">Detect broken links</Card.Heading>
        </Stack>
        <Text color="secondary">Check a page for links that no longer work.</Text>
      </Stack>
    </Card>
  );
}

const getStyles = () => ({
  card: css({
    minWidth: 0,
    overflow: 'hidden',
    textAlign: 'left',

    '> div:first-of-type': {
      height: '100%',
    },
  }),
});
