import { GrafanaTheme2, UrlQueryMap } from '@grafana/data';
import { Button, ButtonGroup, HorizontalGroup, Icon, Link, useStyles2 } from '@grafana/ui';
import { DisplayCard } from 'components/DisplayCard';
import { FeaturesBanner } from 'components/FeaturesBanner';
import { css, cx } from '@emotion/css';
import React from 'react';
import { PLUGIN_URL_PATH } from 'components/constants';

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
  cardGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, auto));
    grid-gap: ${theme.spacing(2)};
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
            <Button variant="secondary">Create a check</Button>
          </div>
        </DisplayCard>
        <DisplayCard className={cx(styles.card, styles.rowCard)}>
          <DisplayCard.Header text="Set up checks programmatically" icon="brackets" />
          <p>Create, configure, and manage checks programmatically via Grizzly or Terraform.</p>
          <Link className={styles.link}>Learn more about creating checks programmatically {'>'}</Link>
          {/* <div className={styles.actionContainer}> */}
          <div className={styles.actionContainer}>
            <HorizontalGroup>
              <Button variant="secondary">Grizzly repo</Button>
              <Button variant="secondary">Terraform repo</Button>
            </HorizontalGroup>
          </div>
          {/* </div> */}
        </DisplayCard>
        <DisplayCard className={cx(styles.card, styles.rowCard)}>
          <DisplayCard.Header text="Configure alerts for your checks" icon="bell" />
          <p>Use default alerts for your checks or customize these alerts to meet your needs.</p>
          <Link className={styles.link}>Read more about synthetic monitoring alerts {'>'}</Link>
          <div className={styles.actionContainer}>
            <Button variant="secondary">Configure alerts</Button>
          </div>
        </DisplayCard>
      </div>
      <div className={styles.flexRow}>
        <DisplayCard className={styles.card}>122 total checks</DisplayCard>
        <DisplayCard className={styles.card}></DisplayCard>
      </div>
    </div>
  );
};

export default HomePage;
