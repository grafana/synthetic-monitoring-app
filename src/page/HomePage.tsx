import { GrafanaTheme2 } from '@grafana/data';
import {
  BigValue,
  BigValueColorMode,
  BigValueGraphMode,
  BigValueTextMode,
  HorizontalGroup,
  Icon,
  Link,
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
  quickLinkGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, auto));
    grid-gap: ${theme.spacing(1)};
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
  quickLink: css`
    background-color: ${theme.colors.background.primary};
    padding: ${theme.spacing(2)};
    display: flex;
    margin-right: ${theme.spacing(1)};
    cursor: pointer;
    min-width: min-content;
    white-space: nowrap;
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
  link: css`
    color: ${theme.colors.text.link};
    margin-bottom: ${theme.spacing(2)};
  `,
  marginBottom: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  centerText: css`
    text-align: center;
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
      <DisplayCard className={cx(styles.card, styles.marginBottom)}>
        <p className={styles.centerText}>Quick links</p>
        <div className={styles.quickLinkGrid}>
          <a className={styles.quickLink} href={`${PLUGIN_URL_PATH}?page=checks`}>
            {/* 
          // check-square is an available icon but not named in the types
          // @ts-ignore */}
            <Icon name="check-square" size="lg" className={styles.quickLinkIcon} />
            Create a check
          </a>
          <a className={styles.quickLink} href={`${PLUGIN_URL_PATH}?page=redirect&dashboard=summary`}>
            <Icon name="apps" size="lg" className={styles.quickLinkIcon} />
            View the summary dashboard
          </a>
          <a className={styles.quickLink} href={`${PLUGIN_URL_PATH}?page=alerts`}>
            <Icon name="bell" size="lg" className={styles.quickLinkIcon} />
            Set up alerts
          </a>
          <a
            className={styles.quickLink}
            href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="file-blank" size="lg" className={styles.quickLinkIcon} />
            Read synthetic monitoring docs
          </a>
        </div>
      </DisplayCard>
      <FeaturesBanner />
      <div className={styles.cardGrid}>
        <DisplayCard className={cx(styles.card, styles.rowCard)}>
          <DisplayCard.Header text="Monitor your entire website" icon="check-square" />
          <p>
            Set up Ping, HTTP, DNS, and TCP checks across your entire website to ensure that all parts are up and
            running for your users.
          </p>
          <Link className={styles.link}>Read more about setting up checks {'>'}</Link>
          <div className={styles.actionContainer}>
            <LinkButton variant="secondary" href={`${PLUGIN_URL_PATH}?page=checks`}>
              Create a check
            </LinkButton>
          </div>
        </DisplayCard>
        <DisplayCard className={cx(styles.card, styles.rowCard)}>
          <DisplayCard.Header text="Set up checks programmatically" icon="brackets" />
          <p>Create, configure, and manage checks programmatically via Grizzly or Terraform.</p>
          <Link className={styles.link}>Learn more about creating checks programmatically {'>'}</Link>
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
          {/* </div> */}
        </DisplayCard>
        <DisplayCard className={cx(styles.card, styles.rowCard)}>
          <DisplayCard.Header text="Configure alerts for your checks" icon="bell" />
          <p>Use default alerts for your checks or customize these alerts to meet your needs.</p>
          <Link className={styles.link}>Read more about synthetic monitoring alerts {'>'}</Link>
          <div className={styles.actionContainer}>
            <LinkButton variant="secondary" href={`${PLUGIN_URL_PATH}?page=alerts`}>
              Configure alerts
            </LinkButton>
          </div>
        </DisplayCard>
      </div>
      <div className={styles.cardGrid}>
        <DisplayCard className={cx(styles.card, styles.usageGrid)}>
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
              text: String(checks.length),
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
              text: String(usage?.activeSeries ?? 'N/A'),
            }}
          />
          <BigValue
            theme={config.theme2}
            textMode={BigValueTextMode.ValueAndName}
            colorMode={BigValueColorMode.Value}
            graphMode={BigValueGraphMode.Area}
            height={100}
            width={250}
            value={{
              numeric: usage?.checksPerMonth ?? 0,
              color: config.theme2.colors.text.primary,
              title: 'Checks run per month',
              text: String(usage?.checksPerMonth ?? 'N/A'),
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
        <DisplayCard className={styles.card}></DisplayCard>
      </div>
    </div>
  );
};

export default HomePage;
