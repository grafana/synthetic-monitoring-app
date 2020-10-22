import React, { FC, useState, useContext } from 'react';
import { Button, Alert, useStyles, HorizontalGroup, VerticalGroup, Icon } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { initializeDatasource } from 'utils';
import { importAllDashboards } from 'dashboards/loader';
import { InstanceContext } from 'components/InstanceContext';
import { GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';
import { colors } from 'components/constants';
import screenshot from 'img/screenshot-dash-http.png';
import circledCheck from 'img/circled-check.svg';
import circledGraph from 'img/circled-graph.svg';
import circledLoki from 'img/circled-loki.svg';
import circledAlert from 'img/circled-alert.svg';
import circledSM from 'img/circled-sm.svg';

const getStyles = (theme: GrafanaTheme) => ({
  bannerContainer: css`
    background: linear-gradient(107.9deg, ${colors.blue01} 30.42%, ${colors.blue02} 100%);
    color: ${colors.darkText};
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
    color: ${colors.darkText};
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
    color: ${colors.darkText};
  `,
  subheaderContent: css`
    margin-bottom: ${theme.spacing.xl};
  `,
  screenshot: css`
    max-height: 300px;
    min-height: 200px;
  `,
});

interface Props {}

export const WelcomePage: FC<Props> = () => {
  const [error, setError] = useState('');
  const { meta } = useContext(InstanceContext);
  const styles = useStyles(getStyles);

  const onClick = async () => {
    console.log('calling on click');
    if (!meta?.jsonData) {
      setError('Invalid plugin configuration');
      return;
    }
    const body = {
      stackId: parseInt(meta.jsonData.grafanaInstanceId ?? '1', 10),
      metricsInstanceId: meta.jsonData.metrics.hostedId,
      logsInstanceId: meta.jsonData.logs.hostedId,
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
                <img src={screenshot} className={styles.screenshot} />
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
      <Button onClick={onClick}>Start</Button>
      {error && <Alert title="Something went wrong:">{error}</Alert>}
    </div>
  );
};
