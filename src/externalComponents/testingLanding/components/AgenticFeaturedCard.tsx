import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { locationService } from '@grafana/runtime';
import { Icon, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import {
  trackAgenticCardClicked,
  trackAgenticCreateButtonClicked,
  trackOpenLinkClicked,
} from 'features/tracking/testingSyntheticsLandingEvents';

import { getPluginLogoUrl } from 'utils/pluginLogoUrl';

import { AGENTIC_URLS, PERFORMANCE_PLUGIN_ID } from '../TestingAndSyntheticsLandingPage.constants';
import { TESTING_LANDING_TEST_IDS } from '../TestingAndSyntheticsLandingPage.testIds';
import { OpenLink } from './OpenLink';

export function AgenticFeaturedCard() {
  const styles = useStyles2(getStyles);

  const handleCardClick = () => {
    trackAgenticCardClicked();
    locationService.push(AGENTIC_URLS.home);
  };

  const handleCreateClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    trackAgenticCreateButtonClicked();
    locationService.push(AGENTIC_URLS.create);
  };

  const handleOpenClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    trackOpenLinkClicked({ product: 'agentic' });
  };

  return (
    <section
      className={styles.card}
      data-testid={TESTING_LANDING_TEST_IDS.agenticCard}
      onClick={handleCardClick}
      role="presentation"
    >
      <span className={styles.accentBar} data-testid={TESTING_LANDING_TEST_IDS.accentBar} aria-hidden="true" />
      <div className={styles.body}>
        <Stack direction="column" gap={2}>
          <Stack direction="column" gap={1}>
            <Stack direction="row" gap={1.5} alignItems="center" wrap="wrap">
              <span className={styles.logoWrap}>
                <img src={getPluginLogoUrl(PERFORMANCE_PLUGIN_ID)} alt="k6" className={styles.logo} />
                <span className={styles.sparkleBadge} aria-hidden="true">
                  <Icon name="ai-sparkle" className={styles.sparkleIcon} />
                </span>
              </span>
              <Text element="h2" variant="h4" weight="medium">
                <Trans i18nKey="agenticFeaturedCard.title">Agentic testing</Trans>
              </Text>
              <OpenLink href={AGENTIC_URLS.home} onClick={handleOpenClick} />
            </Stack>
            <Text variant="body" color="secondary">
              <Trans i18nKey="agenticFeaturedCard.description">
                Write what to test in natural language. Each step runs directly in a browser, with pass/fail results and a
                session recording.
              </Trans>
            </Text>
          </Stack>
          <div onClick={(event) => event.stopPropagation()}>
            <LinkButton variant="primary" icon="plus" href={AGENTIC_URLS.create} onClick={handleCreateClick}>
              <Trans i18nKey="agenticFeaturedCard.createTestButton">Create a test</Trans>
            </LinkButton>
          </div>
        </Stack>
      </div>
    </section>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    card: css({
      label: 'testing-synthetics-agentic-card',
      position: 'relative',
      overflow: 'hidden',
      padding: theme.spacing(3),
      borderRadius: theme.shape.radius.default,
      background: theme.colors.background.secondary,
      cursor: 'pointer',
      transition: 'background 150ms ease-out',
      '&:hover': {
        background: theme.isDark ? 'rgb(40, 43, 49)' : theme.colors.emphasize(theme.colors.background.secondary, 0.03),
      },
      '&:hover [data-testing-synthetics-open-link] svg': {
        transform: 'translateX(2px)',
      },
    }),
    accentBar: css({
      label: 'testing-synthetics-accent-bar',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      background: 'linear-gradient(180deg, #F55F3E 0%, #FF8833 100%)',
      borderRadius: '2px 0 0 2px',
    }),
    body: css({
      label: 'testing-synthetics-agentic-body',
      minWidth: 0,
    }),
    logoWrap: css({
      label: 'testing-synthetics-agentic-logo-wrap',
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
    }),
    logo: css({
      label: 'testing-synthetics-agentic-logo',
      width: 22,
      height: 22,
      objectFit: 'contain',
      display: 'block',
    }),
    sparkleBadge: css({
      label: 'testing-synthetics-sparkle-badge',
      position: 'absolute',
      right: -5,
      bottom: -5,
      width: 14,
      height: 14,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      color: theme.colors.text.primary,
    }),
    sparkleIcon: css({
      label: 'testing-synthetics-sparkle-icon',
      width: 9,
      height: 9,
    }),
  };
}
