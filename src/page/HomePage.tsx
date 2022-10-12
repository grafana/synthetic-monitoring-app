import { GrafanaTheme2 } from '@grafana/data';
import {
  BigValue,
  BigValueColorMode,
  BigValueGraphMode,
  BigValueTextMode,
  HorizontalGroup,
  Icon,
  LinkButton,
  useStyles2,
} from '@grafana/ui';
import { DisplayCard } from 'components/DisplayCard';
import FeaturesBanner from 'components/FeaturesBanner';
import { css, cx } from '@emotion/css';
import React, { useState, useEffect, useContext } from 'react';
import { config } from '@grafana/runtime';
import { InstanceContext } from 'contexts/InstanceContext';
import { Check, ROUTES } from 'types';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { DashboardInfo } from 'datasource/types';
import dashScreenshot from 'img/screenshot-dash-traceroute.png';
import dashScreenshotLight from 'img/screenshot-dash-traceroute-light.png';
import { useNavigation } from 'hooks/useNavigation';
import { PluginPage } from 'components/PluginPage';

const getStyles = (theme: GrafanaTheme2) => ({
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
    margin-bottom: ${theme.spacing(2)};
  `,
  cardFlex: css`
    display: flex;
    margin-bottom: ${theme.spacing(2)};
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
  usageGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, auto));
    grid-gap: ${theme.spacing(1)};
  `,
  usageHeader: css`
    max-width: 220px;
  `,
  link: css`
    color: ${theme.colors.text.link};
    margin-bottom: ${theme.spacing(2)};
  `,
  linksContainer: css`
    margin-right: ${theme.spacing(2)};
    min-width: 475px;
  `,
  marginBottom: css`
    margin-bottom: ${theme.spacing(2)};
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

const sortSummaryToTop = (dashboardA: DashboardInfo, dashboardB: DashboardInfo) => {
  if (dashboardA.title === 'Synthetic Monitoring Summary') {
    return -1;
  }
  if (dashboardB.title === 'Synthetic Monitoring Summary') {
    return 1;
  }
  return 0;
};

const HomePage = () => {
  const styles = useStyles2(getStyles);
  const { instance } = useContext(InstanceContext);
  const [checks, setChecks] = useState<Check[]>([]);
  const [dashboards, setDashboards] = useState<DashboardInfo[]>([]);
  const usage = useUsageCalc(checks);
  const navigate = useNavigation();

  useEffect(() => {
    instance.api?.listChecks().then((checks) => {
      setChecks(checks);
    });
    // Sort to make sure the summary dashboard is at the top of the list
    const sortedDashboards = instance.api?.instanceSettings.jsonData.dashboards.sort(sortSummaryToTop) ?? [];
    setDashboards(sortedDashboards);
  }, [instance.api]);

  return (
    <PluginPage pageNav={{ text: 'Home', description: 'Synthetic Monitoring Home' }}>
      <FeaturesBanner />
      <div className={styles.cardFlex}>
        <DisplayCard className={cx(styles.card, styles.rowCard, styles.linksContainer)}>
          {dashboards.map((dashboard) => {
            return (
              <a className={styles.quickLink} href={`d/${dashboard.uid}`} key={dashboard.uid}>
                <Icon name="apps" size="lg" className={styles.quickLinkIcon} />
                View the {dashboard.title} dashboard
              </a>
            );
          })}
        </DisplayCard>

        <DisplayCard className={cx(styles.card, styles.grow)}>
          <h3>What&apos;s new</h3>
          <p>
            We have a new type of check: traceroute. Traceroute checks show routes through network to a target. Check
            out packet loss, hop distance, and timing from any synthetic monitoring probe.
          </p>
          <img className={styles.image} src={config.theme2.isDark ? dashScreenshot : dashScreenshotLight} />
        </DisplayCard>
      </div>
      <DisplayCard className={cx(styles.card, styles.usageGrid, styles.marginBottom)}>
        <h2 className={styles.usageHeader}>Your Grafana Cloud Synthetic Monitoring usage</h2>
        <BigValue
          theme={config.theme2}
          textMode={BigValueTextMode.ValueAndName}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.Area}
          height={80}
          width={75}
          value={{
            numeric: checks.length,
            color: config.theme2.colors.text.primary,
            title: 'Total checks',
            text: checks.length.toLocaleString(),
          }}
        />
        <BigValue
          theme={config.theme2}
          textMode={BigValueTextMode.ValueAndName}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.Area}
          height={80}
          width={115}
          value={{
            numeric: usage?.activeSeries ?? 0,
            color: config.theme2.colors.text.primary,
            title: 'Total active series',
            text: usage?.activeSeries.toLocaleString() ?? 'N/A',
          }}
        />
        <BigValue
          theme={config.theme2}
          textMode={BigValueTextMode.ValueAndName}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.Area}
          height={80}
          width={115}
          value={{
            numeric: usage?.dpm ?? 0,
            color: config.theme2.colors.text.primary,
            title: 'Data points per minute',
            text: usage?.dpm.toLocaleString() ?? 'N/A',
          }}
        />
        <BigValue
          theme={config.theme2}
          textMode={BigValueTextMode.ValueAndName}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.Area}
          height={80}
          width={175}
          value={{
            numeric: usage?.checksPerMonth ?? 0,
            color: config.theme2.colors.text.primary,
            title: 'Checks executions per month',
            text: usage?.checksPerMonth.toLocaleString() ?? 'N/A',
          }}
        />
        <BigValue
          theme={config.theme2}
          textMode={BigValueTextMode.ValueAndName}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.Area}
          height={80}
          width={150}
          value={{
            numeric: usage?.logsGbPerMonth ?? 0,
            color: config.theme2.colors.text.primary,
            title: 'Logs per month',
            text: `${usage?.logsGbPerMonth.toFixed(2) ?? 0}GB`,
          }}
        />
      </DisplayCard>
      <DisplayCard className={cx(styles.cardGrid, styles.card)}>
        <DisplayCard className={cx(styles.nestedCard, styles.rowCard)}>
          <DisplayCard.Header text="Monitor your entire website" icon="check-square" />
          <p>
            Set up Ping, HTTP, DNS, and TCP checks across your entire website to ensure that all parts are up and
            running for your users.
          </p>
          <a
            className={styles.link}
            target="_blank"
            rel="noopenner noreferrer"
            href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/checks/"
          >
            Read more about setting up checks {'>'}
          </a>
          <div className={styles.actionContainer}>
            <LinkButton variant="secondary" onClick={() => navigate(ROUTES.NewCheck)}>
              Create a check
            </LinkButton>
          </div>
        </DisplayCard>
        <DisplayCard className={cx(styles.nestedCard, styles.rowCard)}>
          <DisplayCard.Header text="Set up checks programmatically" icon="brackets" />
          <p>Create, configure, and manage checks programmatically via Grizzly or Terraform.</p>
          <a
            className={styles.link}
            href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/?manage-checks-with-the-api--config-as-code#manage-checks-with-the-api--config-as-code"
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
            <LinkButton variant="secondary" onClick={() => navigate(ROUTES.Alerts)}>
              Configure alerts
            </LinkButton>
          </div>
        </DisplayCard>
      </DisplayCard>
    </PluginPage>
  );
};

export default HomePage;
