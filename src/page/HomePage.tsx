import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { DisplayCard } from 'components/DisplayCard';
import { FeaturesBanner } from 'components/FeaturesBanner';
import { css, cx } from '@emotion/css';
import React from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  flexRow: css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  `,
  card: css`
    flex-grow: 1;
    background-color: ${theme.colors.background.secondary};
  `,
  link: css`
    background-color: ${theme.colors.background.primary};
    padding: ${theme.spacing(2)};
    display: flex;
    flex-grow: 1;
    margin-right: ${theme.spacing(1)};
    cursor: pointer;
  `,
  linkIcon: css`
    color: ${theme.colors.text.link};
    margin-right: ${theme.spacing(2)};
  `,
  marginBottom: css`
    margin-bottom: ${theme.spacing(2)};
  `,
});

const HomePage = () => {
  const styles = useStyles2(getStyles);
  return (
    <div>
      <DisplayCard className={cx(styles.card, styles.marginBottom)}>
        <p>Quick links</p>
        <div className={styles.flexRow}>
          <div className={styles.link}>
            {/* 
          // check-square is an available icon but not named in the types
          // @ts-ignore */}
            <Icon name="check-square" size="lg" className={styles.linkIcon} />
            Create a check
          </div>
          <div className={styles.link}>
            <Icon name="apps" size="lg" className={styles.linkIcon} />
            View the summary dashboard
          </div>
          <div className={styles.link}>
            <Icon name="bell" size="lg" className={styles.linkIcon} />
            Set up alerts
          </div>
          <div className={styles.link}>
            <Icon name="file-blank" size="lg" className={styles.linkIcon} />
            Read synthetic monitoring docs
          </div>
        </div>
      </DisplayCard>
      <FeaturesBanner />
      <div className={styles.flexRow}>
        <DisplayCard className={styles.card}>
          <p>Monitor your entire website</p>
        </DisplayCard>
        <DisplayCard className={styles.card}>
          <p>Set up checks programmatically</p>
        </DisplayCard>
        <DisplayCard className={styles.card}>
          <p>Configure alerts for your checks</p>
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
