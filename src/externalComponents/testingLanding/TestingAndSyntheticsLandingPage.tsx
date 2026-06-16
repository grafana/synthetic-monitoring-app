import React from 'react';
import { type GrafanaTheme2, type NavModelItem } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Grid, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AgenticFeaturedCard } from './components/AgenticFeaturedCard';
import { ProductPanel } from './components/ProductPanel';
import { UseCaseTile } from './components/UseCaseTile';
import {
  K6_URLS,
  PERFORMANCE_PLUGIN_ID,
  SM_URLS,
  SYNTHETICS_PLUGIN_ID,
} from './TestingAndSyntheticsLandingPage.constants';
import { TESTING_LANDING_TEST_IDS } from './TestingAndSyntheticsLandingPage.testIds';
import { getInstalledPlugins } from './TestingAndSyntheticsLandingPage.utils';

interface Props {
  node: NavModelItem;
}

export function TestingAndSyntheticsLandingPage({ node }: Props) {
  const styles = useStyles2(getStyles);
  const { hasAgentic, hasK6, hasSynthetics } = getInstalledPlugins(node);

  const syntheticsTiles = [
    {
      title: t('testing-and-synthetics-landing.task.make-check.title', 'Make a check'),
      description: t(
        'testing-and-synthetics-landing.task.make-check.description',
        'Set up browser, HTTP, or scripted checks to monitor uptime and user journeys.'
      ),
      actionLabel: t('testing-and-synthetics-landing.task.make-check.action', 'Create'),
      icon: 'heart-rate' as const,
      href: SM_URLS.chooseCheck,
    },
    {
      title: t('testing-and-synthetics-landing.task.manage-probes.title', 'Manage probes'),
      description: t(
        'testing-and-synthetics-landing.task.manage-probes.description',
        'Choose where checks run and add private probes on your network.'
      ),
      actionLabel: t('testing-and-synthetics-landing.task.manage-probes.action', 'Manage'),
      icon: 'map-marker' as const,
      href: SM_URLS.probes,
    },
    {
      title: t('testing-and-synthetics-landing.task.terraform.title', 'Get Terraform config'),
      description: t(
        'testing-and-synthetics-landing.task.terraform.description',
        'Export checks, probes, and tokens for repeatable infrastructure setup.'
      ),
      actionLabel: t('testing-and-synthetics-landing.task.terraform.action', 'View'),
      icon: 'brackets-curly' as const,
      href: SM_URLS.terraform,
    },
  ];

  return (
    <div className={styles.page} data-testid={TESTING_LANDING_TEST_IDS.root}>
      <Stack direction="column" gap={3}>
        {hasAgentic && <AgenticFeaturedCard />}

        {hasK6 && (
          <ProductPanel
            testId={TESTING_LANDING_TEST_IDS.performancePanel}
            logoPluginId={PERFORMANCE_PLUGIN_ID}
            logoAlt="k6"
            title={t('testing-and-synthetics-landing.performance.title', 'Performance testing')}
            openHref={K6_URLS.home}
            description={t(
              'testing-and-synthetics-landing.performance.description',
              'Run tests, catch regressions, and ship with confidence.'
            )}
            actions={
              <>
                <LinkButton variant="secondary" href={K6_URLS.projects} icon="folder">
                  {t('testing-and-synthetics-landing.performance.browse-projects', 'Browse projects')}
                </LinkButton>
                <LinkButton variant="secondary" href={K6_URLS.home} icon="play">
                  {t('testing-and-synthetics-landing.performance.start-testing', 'Start testing')}
                </LinkButton>
              </>
            }
          />
        )}

        {hasSynthetics && (
          <ProductPanel
            testId={TESTING_LANDING_TEST_IDS.syntheticsPanel}
            logoPluginId={SYNTHETICS_PLUGIN_ID}
            logoAlt="Synthetic monitoring"
            title={t('testing-and-synthetics-landing.synthetics.title', 'Synthetic monitoring')}
            openHref={SM_URLS.home}
            description={t(
              'testing-and-synthetics-landing.synthetics.description',
              'Verify services and user journeys are working from probe locations worldwide.'
            )}
          >
            <Grid columns={{ xs: 1, md: 3 }} gap={2}>
              {syntheticsTiles.map((tile) => (
                <UseCaseTile
                  key={tile.href}
                  title={tile.title}
                  description={tile.description}
                  actionLabel={tile.actionLabel}
                  icon={tile.icon}
                  href={tile.href}
                />
              ))}
            </Grid>
          </ProductPanel>
        )}
      </Stack>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    page: css({
      label: 'testing-synthetics-landing-page',
      maxWidth: 1120,
      padding: theme.spacing(0, 0, 12),
      color: theme.colors.text.primary,
    }),
  };
}
