import React, { useContext, useEffect, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { HorizontalGroup, Icon, LinkButton, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { FeatureName, ROUTES } from 'types';
import { DashboardInfo } from 'datasource/types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { PLUGIN_URL_PATH } from 'components/constants';
import { DisplayCard } from 'components/DisplayCard';
import FeaturesBanner from 'components/FeaturesBanner';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';
import { UsageStats } from 'components/UsageStats';

const sortSummaryToTop = (dashboardA: DashboardInfo, dashboardB: DashboardInfo) => {
  if (dashboardA.title === 'Synthetic Monitoring Summary') {
    return -1;
  }
  if (dashboardB.title === 'Synthetic Monitoring Summary') {
    return 1;
  }
  return 0;
};

export const HomePage = () => {
  const styles = useStyles2(getStyles);
  const { instance } = useContext(InstanceContext);
  const [dashboards, setDashboards] = useState<Array<Partial<DashboardInfo>>>([]);
  const { isEnabled: scenesEnabled } = useFeatureFlag(FeatureName.Scenes);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  const { isEnabled: scriptedEnabled } = useFeatureFlag(FeatureName.ScriptedChecks);

  useEffect(() => {
    // Sort to make sure the summary dashboard is at the top of the list
    if (!scenesEnabled) {
      const sortedDashboards = instance.api?.instanceSettings.jsonData.dashboards.sort(sortSummaryToTop) ?? [];
      setDashboards(sortedDashboards);
    } else {
      const dashboardList = [
        {
          title: 'Summary dashboard',
          uid: '',
        },
        {
          title: 'HTTP dashboard',
          uid: 'http',
        },
        {
          title: 'PING dashboard',
          uid: 'ping',
        },
        {
          title: 'DNS dashboard',
          uid: 'dns',
        },

        {
          title: 'TCP dashboard',
          uid: 'tcp',
        },
        {
          title: 'Traceroute dashboard',
          uid: 'traceroute',
        },
      ];
      if (multiHttpEnabled) {
        dashboardList.splice(3, 0, { title: 'MULTIHTTP dashboard', uid: 'multihttp' });
      }

      if (scriptedEnabled) {
        dashboardList.push({ title: 'Scripted dashboard', uid: 'k6' });
      }

      setDashboards(dashboardList);
    }
  }, [instance.api, scenesEnabled, multiHttpEnabled, scriptedEnabled]);

  return (
    <PluginPage pageNav={{ text: 'Home' }}>
      <div className={styles.page}>
        <FeaturesBanner />
        <DisplayCard className={cx(styles.card, styles.getStartedGrid)}>
          <LinkButton variant="primary" size="lg" href={getRoute(ROUTES.ChooseCheckType)}>
            Create a check
          </LinkButton>
          <h2 className={styles.separator}>or</h2>
          <LinkButton variant="primary" size="lg" href={getRoute(ROUTES.Checks)}>
            View existing checks
          </LinkButton>
        </DisplayCard>
        <div className={styles.cardFlex}>
          <DisplayCard className={cx(styles.card, styles.rowCard, styles.linksContainer)}>
            {dashboards.map((dashboard) => {
              return (
                <a
                  className={styles.quickLink}
                  href={
                    scenesEnabled
                      ? dashboard.uid === ``
                        ? `${PLUGIN_URL_PATH}scene`
                        : `${PLUGIN_URL_PATH}scene/${dashboard.uid}`
                      : `d/${dashboard.uid}`
                  }
                  key={dashboard.uid}
                >
                  <Icon name="apps" size="lg" className={styles.quickLinkIcon} />
                  {scenesEnabled ? `View the ${dashboard.title}` : `View the ${dashboard.title} dashboard`}
                </a>
              );
            })}
          </DisplayCard>
          <DisplayCard className={cx(styles.cardGrid, styles.card)}>
            <DisplayCard className={cx(styles.nestedCard, styles.rowCard)}>
              <DisplayCard.Header text="Set up checks programmatically" icon="brackets" />
              <p>Create, configure, and manage checks programmatically via Grizzly or Terraform.</p>
              <a
                className={styles.link}
                href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/?manage-checks-with-the-api--config-as-code#config-as-code"
                target="_blank"
                rel="noopenner noreferrer"
              >
                Learn more about creating checks programmatically {'>'}
              </a>
              <div className={styles.actionContainer}>
                <HorizontalGroup>
                  <LinkButton
                    variant="secondary"
                    target="_blank"
                    rel="noopenner noreferrer"
                    href="https://github.com/grafana/grizzly"
                  >
                    Grizzly repo
                  </LinkButton>
                  <LinkButton
                    variant="secondary"
                    href="https://registry.terraform.io/providers/grafana/grafana/latest/docs"
                    target="_blank"
                    rel="noopenner noreferrer"
                  >
                    Terraform docs
                  </LinkButton>
                </HorizontalGroup>
              </div>
            </DisplayCard>
            <DisplayCard className={cx(styles.nestedCard, styles.rowCard)}>
              <DisplayCard.Header text="Configure alerts for your checks" icon="bell" />
              <p>Use default alerts for your checks or customize these alerts to meet your needs.</p>
              <a
                className={styles.link}
                href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/synthetic-monitoring-alerting/"
                target="_blank"
                rel="noopenner noreferrer"
              >
                Read more about synthetic monitoring alerts {'>'}
              </a>
              <div className={styles.actionContainer}>
                <LinkButton variant="secondary" href={getRoute(ROUTES.Alerts)}>
                  Configure alerts
                </LinkButton>
              </div>
            </DisplayCard>
          </DisplayCard>
        </div>
        <UsageStats />
      </div>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  page: css`
    width: 100%;
  `,
  flexRow: css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  `,
  card: css`
    background-color: ${theme.colors.background.secondary};
  `,
  rowCard: css`
    display: flex;
    flex-direction: column;
  `,
  cardGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, auto));
    grid-gap: ${theme.spacing(2)};
    width: 100%;
  `,
  cardFlex: css`
    display: flex;
    width: 100%;
    margin-bottom: ${theme.spacing(2)};
  `,
  getStartedGrid: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(2)};
    align-items: center;
    justify-content: center;
    margin-bottom: ${theme.spacing(2)};
    h2 {
      margin-bottom: 0;
    }
  `,
  separator: css`
    margin: 0 ${theme.spacing(6)};
  `,
  grow: css`
    flex-grow: 1;
    overflow-y: auto;
    max-height: 500px;
  `,
  nestedCard: css`
    background-color: ${theme.colors.background.primary};
    box-shadow: none;
  `,
  quickLink: css`
    background-color: ${theme.colors.background.primary};
    padding: ${theme.spacing(2)};
    display: flex;
    cursor: pointer;
    width: 100%;
    white-space: nowrap;
    margin-bottom: ${theme.spacing(1)};
  `,
  quickLinkIcon: css`
    color: ${theme.colors.text.link};
    margin-right: ${theme.spacing(2)};
  `,
  link: css`
    color: ${theme.colors.text.link};
    margin-bottom: ${theme.spacing(2)};
  `,
  linksContainer: css`
    margin-right: ${theme.spacing(2)};
    min-width: 475px;
  `,
  actionContainer: css`
    margin-top: auto;
  `,
  image: css`
    max-width: 100%;
    max-height: 75%;
    display: block;
    margin: auto;
  `,
});
