import React, { FC, useState, useContext } from 'react';
import { Button, Alert, useStyles, HorizontalGroup, VerticalGroup, Icon } from '@grafana/ui';
import { getBackendSrv, config } from '@grafana/runtime';
import { initializeDatasource } from 'utils';
import { importAllDashboards } from 'dashboards/loader';
import { InstanceContext } from 'components/InstanceContext';
import { GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';
import { colors } from 'components/constants';
import dashboardScreenshot from 'img/screenshot-dash-http.png';
import circledCheck from 'img/circled-check.svg';
import circledGraph from 'img/circled-graph.svg';
import circledLoki from 'img/circled-loki.svg';
import circledAlert from 'img/circled-alert.svg';
import circledSM from 'img/circled-sm.svg';
import checkScreenshot from 'img/check-screenshot.png';

const getStyles = (theme: GrafanaTheme) => {
  const textColor = theme.isDark ? colors.darkText : undefined;
  return {
    bannerContainer: css`
      background: linear-gradient(107.9deg, ${colors.blue01} 30.42%, ${colors.blue02} 100%);
      color: ${textColor};
    `,
    bannerBackground: css`
      background-image: url(${circledSM});
      background-repeat: no-repeat;
      background-position: top 20px right;
      display: flex;
      justify-content: center;
    `,
    banner: css`
      max-width: 1500px;
      padding: 60px 120px 120px 120px;
    `,
    headerSection: css`
      display: flex;
      align-items: center;
      margin-bottom: ${theme.spacing.xl};
    `,
    headerTitle: css`
      color: ${textColor};
    `,
    headerLogo: css`
      height: 78px;
      width: 78px;
      margin-right: ${theme.spacing.lg};
    `,
    headerSubtext: css`
      margin-bottom: 0;
      line-height: 20px;
    `,
    subheaderSection: css`
      display: flex;
      align-items: center;
    `,
    subheaderTextContainer: css`
      padding: 0 ${theme.spacing.xl};
      p {
        margin-bottom: 0;
      }
    `,
    subheaderTitle: css`
      margin-bottom: ${theme.spacing.md};
      color: ${textColor};
    `,
    subheaderContent: css`
      margin-bottom: ${theme.spacing.xl};
    `,
    screenshot: css`
      max-height: 300px;
      min-height: 200px;
    `,
    getStartedContainer: css`
      display: flex;
      justify-content: center;
    `,
    getStarted: css`
      max-width: 1500px;
      padding: 40px 120px 120px 120px;
      color: ${textColor};
    `,
    getStartedTitle: css`
      color: ${textColor};
      margin-bottom: ${theme.spacing.md};
    `,
    getStartedContent: css`
      display: flex;
      align-items: flex-start;
    `,
    getStartedChecks: css`
      display: flex;
      flex-flow: column nowrap;
      align-items: flex-start;
      margin-right: ${theme.spacing.lg};
    `,
    checkScreenshot: css`
      min-width: 400px;
      margin-bottom: ${theme.spacing.lg};
    `,
    datasourceContainer: css`
      width: 100%;
      border: 2px solid ${colors.blue03};
      border-radius: 4px;
      background-color: ${colors.black};
      box-shadow: 0px 0px 4px ${colors.blue03};
    `,
    datasource: css`
      display: flex;
      align-items: center;
      padding: ${theme.spacing.lg};
      width: 100%;
      p {
        margin-bottom: 0;
      }
    `,
    datasourceTitle: css`
      color: ${textColor};
      margin-bottom: ${theme.spacing.xs};
    `,
    datasourceLogo: css`
      height: 48px;
      margin-right: ${theme.spacing.sm};
    `,
  };
};

interface Props {}

export const WelcomePage: FC<Props> = () => {
  const [error, setError] = useState('');
  const { meta } = useContext(InstanceContext);
  const styles = useStyles(getStyles);

  const metricsName = meta?.jsonData?.metrics.grafanaName ?? '';
  const metricsDatasource = config.datasources[metricsName];
  const logsName = meta?.jsonData?.logs.grafanaName ?? '';
  const logsDatasource = config.datasources[logsName];

  const onClick = async () => {
    console.log('calling on click');
    if (!meta?.jsonData) {
      setError('Invalid plugin configuration');
      return;
    }
    const body = {
      stackId: parseInt(meta.jsonData.grafanaInstanceId ?? '1', 10),
      metricsInstanceId: meta.jsonData.metrics?.hostedId,
      logsInstanceId: meta.jsonData.logs?.hostedId,
    };
    try {
      const { accessToken } = await getBackendSrv().request({
        url: `api/plugin-proxy/${meta.id}/register`,
        method: 'POST',
        data: body,
      });
      const dashboards = await importAllDashboards(meta.jsonData.metrics.grafanaName, meta.jsonData.logs.grafanaName);
      const datasourcePayload = {
        apiHost: meta.jsonData.apiHost,
        accessToken,
        metrics: meta.jsonData.metrics,
        logs: meta.jsonData.logs,
      };

      await initializeDatasource(datasourcePayload, dashboards);

      // force reload so that GrafanaBootConfig is updated.
      window.location.reload();
    } catch (e) {
      setError(e.data?.msg);
    }
  };

  return (
    <div>
      <div className={styles.bannerContainer}>
        <div className={styles.bannerBackground}>
          <div className={styles.banner}>
            <div className={styles.headerSection}>
              <img src={meta?.info.logos.small} className={styles.headerLogo} />
              <div>
                <h2 className={styles.headerTitle}>Welcome to Grafana Cloud Synthetic Monitoring</h2>
                <p className={styles.headerSubtext}>
                  Synthetic Monitoring provides you with insights into how your applications and services are behaving
                  from an external point of view. We provide 21 probe locations from around the world which assess
                  availability, performance, and correctness of your services. <a href="FIXME">Read more &gt;</a>
                </p>
              </div>
            </div>
            <div>
              <div className={styles.subheaderSection}>
                <img src={dashboardScreenshot} className={styles.screenshot} />
                <div className={styles.subheaderTextContainer}>
                  <h3 className={styles.subheaderTitle}>What you can do</h3>
                  <div className={styles.subheaderContent}>
                    <HorizontalGroup>
                      <VerticalGroup spacing="md">
                        <HorizontalGroup align="center">
                          <img src={circledCheck} />
                          <p>Create checks to monitor your services from Grafana hosted or private probes</p>
                        </HorizontalGroup>
                        <HorizontalGroup>
                          <img src={circledLoki} />
                          <p>Troubleshoot issues using log exploration</p>
                        </HorizontalGroup>
                      </VerticalGroup>
                      <VerticalGroup spacing="md">
                        <HorizontalGroup>
                          <img src={circledGraph} />
                          <p>Visualize and query metrics and logs using pre-built dashboards</p>
                        </HorizontalGroup>
                        <HorizontalGroup>
                          <img src={circledAlert} />
                          <p>Set up Prometheus style alerts</p>
                        </HorizontalGroup>
                      </VerticalGroup>
                    </HorizontalGroup>
                  </div>
                  <p>
                    Synthetic Monitoring is available to hosted Grafana Cloud customers. We bill you based on the
                    metrics and logs that are published to your Grafana Cloud stack.{' '}
                    <a href="FIXME">Learn more about Synthetic Monitoring pricing &gt;</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.getStartedContainer}>
        <div className={styles.getStarted}>
          <h3 className={styles.getStartedTitle}>How to get started</h3>
          <div className={styles.getStartedContent}>
            <div className={styles.getStartedChecks}>
              <p>
                Get started with Synthetic Monitoring by creating checks. You can choose from Ping, HTTP, DNS, or TCP.
              </p>
              <img src={checkScreenshot} className={styles.checkScreenshot} />
              <Button onClick={onClick} disabled={!Boolean(metricsDatasource) || !Boolean(logsDatasource)}>
                Create your first check
              </Button>
              {error && <Alert title="Something went wrong:">{error}</Alert>}
            </div>
            <VerticalGroup>
              <p>Metrics and logs from the checks that you create will be published to this Grafana Cloud stack.</p>
              <div className={styles.datasourceContainer}>
                {metricsDatasource ? (
                  <div className={styles.datasource}>
                    <img className={styles.datasourceLogo} src={metricsDatasource.meta.info.logos.small} />
                    <VerticalGroup>
                      <h5 className={styles.datasourceTitle}>{metricsDatasource.name}</h5>
                      <p>{metricsDatasource.jsonData.directUrl}</p>
                    </VerticalGroup>
                  </div>
                ) : (
                  <Alert title="Missing Prometheus datasource">
                    Synthetic Monitoring requires a Prometheus datasource connected to an instance hosted in Grafana
                    Cloud
                  </Alert>
                )}
                <div className={styles.datasource}>
                  <img className={styles.datasourceLogo} src={logsDatasource.meta.info.logos.small} />
                  <VerticalGroup>
                    <h5 className={styles.datasourceTitle}>{metricsDatasource.name}</h5>
                    <p>{metricsDatasource.jsonData.directUrl}</p>
                  </VerticalGroup>
                </div>
              </div>
            </VerticalGroup>
          </div>
        </div>
      </div>
    </div>
  );
};
