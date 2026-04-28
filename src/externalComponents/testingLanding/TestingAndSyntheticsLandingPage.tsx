import React from 'react';
import { type GrafanaTheme2, type NavModelItem } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { config } from '@grafana/runtime';
import { Badge, Card, Grid, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface TaskCard {
  title: string;
  kind: string;
  href: string;
}

interface ProductLink {
  label: string;
  href: string;
}

interface Props {
  node: NavModelItem;
}

const SYNTHETICS_PLUGIN_ID = 'grafana-synthetic-monitoring-app';
const PERFORMANCE_PLUGIN_ID = 'k6-app';

// Base paths for each product. These are stable — specific sub-paths live inline
// below so it's easy for product owners to update them without hunting.
const SM_BASE = '/a/grafana-synthetic-monitoring-app';
const K6_BASE = '/a/k6-app';

const SM_URLS = {
  home: `${SM_BASE}/home`,
  checks: `${SM_BASE}/checks`,
  newBrowser: `${SM_BASE}/checks/new/browser`,
  newEndpoint: `${SM_BASE}/checks/new/api-endpoint`,
  newScripted: `${SM_BASE}/checks/new/scripted`,
  probes: `${SM_BASE}/probes`,
};

const K6_URLS = {
  home: `${K6_BASE}`,
  projects: `${K6_BASE}/projects`,
  loadZones: `${K6_BASE}/settings/load-zones`,
};

const pluginCatalogUrl = (pluginId: string) => `/plugins/${pluginId}`;

const DOC_URLS = {
  syntheticsDocs: 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/',
  performanceDocs: 'https://grafana.com/docs/grafana-cloud/testing/k6/',
};

export function TestingAndSyntheticsLandingPage({ node }: Props) {
  const styles = useStyles2(getStyles);

  const children = node?.children?.filter((child) => !child.hideFromTabs) ?? [];

  const hasSynthetics = children.some(
    (child) => child.pluginId === SYNTHETICS_PLUGIN_ID || child.id?.includes('synthetic-monitoring')
  );
  const hasPerformance = children.some(
    (child) => child.pluginId === PERFORMANCE_PLUGIN_ID || child.id?.includes('k6')
  );
  const canInstallPlugins = Boolean(config.bootData?.user?.permissions?.['plugins:install']);

  const syntheticsTasks: TaskCard[] = [
    {
      title: t(
        'testing-and-synthetics-landing.task.synthetics-browser.title',
        'Verify a login or other critical user journey'
      ),
      kind: t('testing-and-synthetics-landing.task.synthetics-browser.kind', 'Browser check'),
      href: SM_URLS.newBrowser,
    },
    {
      title: t(
        'testing-and-synthetics-landing.task.synthetics-endpoint.title',
        'Check that a URL, host, or port is reachable'
      ),
      kind: t(
        'testing-and-synthetics-landing.task.synthetics-endpoint.kind',
        'HTTP, TCP, DNS, ping, or traceroute'
      ),
      href: SM_URLS.newEndpoint,
    },
    {
      title: t(
        'testing-and-synthetics-landing.task.synthetics-scripted.title',
        'Validate a multi-step API workflow'
      ),
      kind: t(
        'testing-and-synthetics-landing.task.synthetics-scripted.kind',
        'Scripted check — k6 script with assertions'
      ),
      href: SM_URLS.newScripted,
    },
  ];

  const performanceTasks: TaskCard[] = [
    {
      title: t(
        'testing-and-synthetics-landing.task.performance-load.title',
        'Simulate hundreds of concurrent users hitting my app'
      ),
      kind: t('testing-and-synthetics-landing.task.performance-load.kind', 'Load test'),
      href: K6_URLS.home,
    },
    {
      title: t('testing-and-synthetics-landing.task.performance-ci.title', 'Catch performance regressions in CI/CD'),
      kind: t('testing-and-synthetics-landing.task.performance-ci.kind', 'Automated performance testing'),
      href: K6_URLS.home,
    },
    {
      title: t('testing-and-synthetics-landing.task.performance-stress.title', 'Prepare for a high-volume launch or sale'),
      kind: t('testing-and-synthetics-landing.task.performance-stress.kind', 'Stress test'),
      href: K6_URLS.home,
    },
  ];

  const syntheticsLinks: ProductLink[] = [
    {
      label: t('testing-and-synthetics-landing.synthetics.link.checks', 'Checks'),
      href: SM_URLS.checks,
    },
    {
      label: t('testing-and-synthetics-landing.synthetics.link.probes', 'Probes'),
      href: SM_URLS.probes,
    },
  ];

  const performanceLinks: ProductLink[] = [
    {
      label: t('testing-and-synthetics-landing.performance.link.projects', 'Projects & test runs'),
      href: K6_URLS.projects,
    },
    {
      label: t('testing-and-synthetics-landing.performance.link.loadzones', 'Load zones'),
      href: K6_URLS.loadZones,
    },
  ];

  return (
    <Stack direction="column" gap={4}>
      {hasSynthetics && (
        <section className={styles.section}>
          <Text variant="h5" element="h2" color="secondary">
            <Trans i18nKey="testing-and-synthetics-landing.synthetics.section-label">Synthetic Monitoring</Trans>
          </Text>
          <Grid columns={{ xs: 1, md: 3 }} gap={2}>
            {syntheticsTasks.map((task, idx) => (
              <TaskCardItem key={idx} task={task} />
            ))}
          </Grid>
        </section>
      )}

      {hasPerformance && (
        <section className={styles.section}>
          <Text variant="h5" element="h2" color="secondary">
            <Trans i18nKey="testing-and-synthetics-landing.performance.section-label">Performance Testing</Trans>
          </Text>
          <Grid columns={{ xs: 1, md: 3 }} gap={2}>
            {performanceTasks.map((task, idx) => (
              <TaskCardItem key={idx} task={task} />
            ))}
          </Grid>
        </section>
      )}

      <Grid columns={{ xs: 1, md: 2 }} gap={2}>
        <ProductCard
          pluginId={SYNTHETICS_PLUGIN_ID}
          href={SM_URLS.home}
          title={t('testing-and-synthetics-landing.synthetics.title', 'Synthetic Monitoring')}
          description={t(
            'testing-and-synthetics-landing.synthetics.description',
            'Verify services and user journeys are working from probe locations worldwide.'
          )}
          links={syntheticsLinks}
          docsHref={DOC_URLS.syntheticsDocs}
          isInstalled={hasSynthetics}
          canInstall={canInstallPlugins}
        />
        <ProductCard
          pluginId={PERFORMANCE_PLUGIN_ID}
          href={K6_URLS.home}
          title={t('testing-and-synthetics-landing.performance.title', 'Performance Testing')}
          description={t(
            'testing-and-synthetics-landing.performance.description',
            'Performance testing powered by k6 — run scripts at scale to measure how your system behaves under load.'
          )}
          links={performanceLinks}
          docsHref={DOC_URLS.performanceDocs}
          isInstalled={hasPerformance}
          canInstall={canInstallPlugins}
        />
      </Grid>
    </Stack>
  );
}

function TaskCardItem({ task }: { task: TaskCard }) {
  const styles = useStyles2(getStyles);
  return (
    <Card href={task.href} noMargin className={styles.taskCard}>
      <Card.Heading>{task.title}</Card.Heading>
      <Card.Description>
        <span className={styles.taskKind}>{task.kind}</span>
      </Card.Description>
    </Card>
  );
}

interface ProductCardProps {
  pluginId: string;
  href: string;
  title: string;
  description: string;
  links: ProductLink[];
  docsHref: string;
  isInstalled: boolean;
  canInstall: boolean;
}

function ProductCard({
  pluginId,
  href,
  title,
  description,
  links,
  docsHref,
  isInstalled,
  canInstall,
}: ProductCardProps) {
  const styles = useStyles2(getStyles);

  const leadingItems: React.ReactNode[] = isInstalled
    ? links.map((link) => (
        <TextLink key={link.label} href={link.href} inline={false} variant="bodySmall">
          {link.label}
        </TextLink>
      ))
    : canInstall
      ? [
          <TextLink key="install" href={pluginCatalogUrl(pluginId)} inline={false} external variant="bodySmall">
            <Trans i18nKey="testing-and-synthetics-landing.product.install-cta">Install this plugin</Trans>
          </TextLink>,
        ]
      : [
          <Text key="ask-admin" variant="bodySmall" color="secondary">
            <Trans i18nKey="testing-and-synthetics-landing.product.ask-admin">
              Ask an admin to install this plugin
            </Trans>
          </Text>,
        ];

  const actionItems: React.ReactNode[] = [
    ...leadingItems,
    <TextLink key="docs" href={docsHref} inline={false} external variant="bodySmall">
      <Trans i18nKey="testing-and-synthetics-landing.product.docs">Docs</Trans>
    </TextLink>,
  ];

  return (
    <div className={styles.productCard}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
          {isInstalled ? (
            <TextLink href={href} inline={false} variant="h5" weight="medium">
              {title}
            </TextLink>
          ) : (
            <Text variant="h5" weight="medium" element="span">
              {title}
            </Text>
          )}
          {!isInstalled && (
            <Badge
              color="darkgrey"
              text={t('testing-and-synthetics-landing.product.not-installed', 'Not installed')}
            />
          )}
        </Stack>
        <Text variant="bodySmall" color="secondary">
          {description}
        </Text>

        <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
          {actionItems.map((item, idx) => (
            <span key={idx} className={styles.inlineLink}>
              {idx > 0 && (
                <Text variant="bodySmall" color="secondary">
                  ·
                </Text>
              )}
              {item}
            </span>
          ))}
        </Stack>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    label: 'testing-synthetics-section',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  taskCard: css({
    label: 'testing-synthetics-task-card',
    height: '100%',
  }),
  taskKind: css({
    label: 'testing-synthetics-task-kind',
    color: theme.colors.text.secondary,
  }),
  productCard: css({
    label: 'testing-synthetics-product-card',
    padding: theme.spacing(2),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.primary,
  }),
  inlineLink: css({
    label: 'testing-synthetics-inline-link',
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
});
