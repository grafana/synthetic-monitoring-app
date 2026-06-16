import React, { useCallback } from 'react';
import { type GrafanaTheme2, type IconName } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Icon, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackSyntheticsTileClicked } from 'features/tracking/testingSyntheticsLandingEvents';

import { type SyntheticsTile } from 'features/tracking/testingSyntheticsLandingEvents.types';

import { TESTING_LANDING_TEST_IDS } from '../TestingAndSyntheticsLandingPage.testIds';

const TILE_ACTION_ATTR = 'data-testing-synthetics-tile-action';
const TILE_ACTION_ICON = `[${TILE_ACTION_ATTR}] [data-testid^="icon-"]`;

interface UseCaseTileProps {
  tile: SyntheticsTile;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: IconName;
}

export function UseCaseTile({ tile, title, description, href, actionLabel, icon }: UseCaseTileProps) {
  const styles = useStyles2(getStyles);

  const handleTileClick = useCallback(() => {
    trackSyntheticsTileClicked({ tile, interaction: 'tile' });
    locationService.push(href);
  }, [href, tile]);

  const handleActionClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      trackSyntheticsTileClicked({ tile, interaction: 'action-button' });
      locationService.push(href);
    },
    [href, tile]
  );

  return (
    <div
      className={styles.tile}
      data-testid={TESTING_LANDING_TEST_IDS.useCaseTile}
      onClick={handleTileClick}
      role="presentation"
    >
      <Stack direction="row" gap={1} alignItems="center">
        <Icon name={icon} />
        <Text variant="body" weight="medium">
          {title}
        </Text>
      </Stack>
      <Text variant="body" color="secondary">
        {description}
      </Text>
      <div
        className={styles.actionWrap}
        data-testing-synthetics-tile-action
        onClick={(event) => event.stopPropagation()}
      >
        <LinkButton
          variant="secondary"
          size="sm"
          href={href}
          icon="arrow-right"
          iconPlacement="right"
          className={styles.actionButton}
          onClick={handleActionClick}
        >
          {actionLabel}
        </LinkButton>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const tileBackground = theme.colors.emphasize(theme.colors.background.secondary, 0.03);
  const tileHoverBackground = theme.colors.emphasize(theme.colors.background.secondary, 0.06);
  const actionButtonHoverBackground = theme.colors.emphasize(theme.colors.background.secondary, 0.08);

  return {
    tile: css({
      label: 'testing-synthetics-use-case-tile',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      padding: theme.spacing(2, 2.5),
      minHeight: 128,
      borderRadius: theme.shape.radius.default,
      background: tileBackground,
      cursor: 'pointer',
      transition: 'background 150ms ease-out',
      '&:hover': {
        background: tileHoverBackground,
      },
      [`&:hover ${TILE_ACTION_ICON}`]: {
        transform: 'translateX(2px)',
      },
      [`&:hover [${TILE_ACTION_ATTR}] a`]: {
        background: actionButtonHoverBackground,
      },
    }),
    actionWrap: css({
      label: 'testing-synthetics-tile-action-wrap',
      marginTop: 'auto',
      paddingTop: theme.spacing(2),
      alignSelf: 'flex-start',
      [`& [data-testid^="icon-"]`]: {
        transition: 'transform 150ms ease-out',
      },
      [`&:hover [data-testid^="icon-"]`]: {
        transform: 'translateX(2px)',
      },
    }),
    actionButton: css({
      label: 'testing-synthetics-tile-action',
      boxShadow: 'none',
      transition: 'background 150ms ease-out',
      '&:hover': {
        background: actionButtonHoverBackground,
        boxShadow: 'none',
      },
      '&:hover [data-testid^="icon-"]': {
        transform: 'translateX(2px)',
      },
      '&:focus': {
        boxShadow: 'none',
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.colors.text.link}`,
        outlineOffset: '2px',
        boxShadow: 'none',
      },
      '&:focus:not(:focus-visible)': {
        outline: 'none',
        boxShadow: 'none',
      },
    }),
  };
}
