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
import { FeaturesBanner } from 'components/FeaturesBanner';
import { css, cx } from '@emotion/css';
import React, { useState, useEffect, useContext } from 'react';
import { PLUGIN_URL_PATH } from 'components/constants';
import { config } from '@grafana/runtime';
import { InstanceContext } from 'contexts/InstanceContext';
import { Check } from 'types';
import { useUsageCalc } from 'hooks/useUsageCalc';

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
    grid-template-columns: repeat(auto-fit, minmax(250px, auto));
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
    min-width: 450px;
  `,
  marginBottom: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  actionContainer: css`
    margin-top: auto;
  `,
});

const HomePage = () => {
  const styles = useStyles2(getStyles);
  const { instance } = useContext(InstanceContext);
  const [checks, setChecks] = useState<Check[]>([]);
  const usage = useUsageCalc(checks);
  useEffect(() => {
    instance.api?.listChecks().then((checks) => {
      setChecks(checks);
    });
  }, [instance.api]);

  return (
    <div>
      <FeaturesBanner />
      <div className={styles.cardFlex}>
        <DisplayCard className={cx(styles.card, styles.rowCard, styles.linksContainer)}>
          {instance.api?.instanceSettings.jsonData.dashboards
            // Sort to make sure the summary dashboard is at the top of the list
            .sort((dashA, dashB) => {
              if (dashA.title === 'Synthetic Monitoring Summary') {
                return -1;
              }
              if (dashB.title === 'Synthetic Monitoring Summary') {
                return 1;
              }
              return 0;
            })
            .map((dashboard) => {
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
            We will making some updates to our probes in Grafana Cloud synthetic monitoring. The changes will include:
          </p>
          <ul>
            <li>
              Deprecating the <code>San Jose</code> probe. We recommend moving to the <code>San Francisco</code> probe
              as a replacement.
            </li>
            <li>
              Deprecating <code>Chicago</code>. We recommend moving to <code>Boston</code> as a replacement
            </li>
            <li>
              Fixing a typo: <code>Seol</code> will become <code>Seoul</code>
            </li>
          </ul>
        </DisplayCard>
      </div>
      <DisplayCard className={cx(styles.card, styles.usageGrid, styles.marginBottom)}>
        <h2 className={styles.usageHeader}>Your Grafana Cloud synthetic monitoring usage</h2>
        <BigValue
          theme={config.theme2}
          textMode={BigValueTextMode.ValueAndName}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.Area}
          height={100}
          width={150}
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
          height={100}
          width={150}
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
          height={100}
          width={225}
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
          height={100}
          width={200}
          value={{
            numeric: usage?.logsGbPerMonth ?? 0,
            color: config.theme2.colors.text.primary,
            title: 'Logs',
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
            <LinkButton variant="secondary" href={`${PLUGIN_URL_PATH}?page=checks`}>
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
            <LinkButton variant="secondary" href={`${PLUGIN_URL_PATH}?page=alerts`}>
              Configure alerts
            </LinkButton>
          </div>
        </DisplayCard>
      </DisplayCard>
    </div>
  );
};

export default HomePage;
