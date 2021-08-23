import React from 'react';
import {
  bell,
  bellLight,
  welcomeGraph,
  welcomeGraphLight,
  loki,
  dividingLine,
  whatYouCanDoBG,
  whatYouCanDoBGLight,
  checkSquare,
  checkSquareLight,
} from 'img';
import { GrafanaTheme2 } from '@grafana/data';
import { HorizontalGroup, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { config } from '@grafana/runtime';

const getStyles = (theme: GrafanaTheme2) => ({
  heading: css`
    margin-bottom: ${theme.spacing(2)};
    color: ${theme.colors.text.maxContrast};
  `,
  whatYouCanDoContainer: css`
    margin-bottom: ${theme.spacing(3)};
    background-image: url(${theme.isDark ? whatYouCanDoBG : whatYouCanDoBGLight});
    background-repeat: no-repeat;
    background-position: left bottom;
    padding: ${theme.spacing(6)};
    box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.6);
    box-shadow: ${theme.isDark ? '0px 4px 10px 0px rgba(0, 0, 0, 0.6)' : '0px 4px 10px 0px rgba(195, 195, 195, 0.2)'};
  `,
  whatYouCanDoHeader: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  featuresContainer: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    grid-auto-flow: row dense;
    grid-gap: ${theme.spacing(3)};
  `,
  mediumMarginBottom: css`
    margin-bottom: ${theme.spacing(4)};
  `,
  divider: css`
    margin-right: ${theme.spacing(2)};
  `,
  text: css`
    color: ${theme.colors.text.primary};
    min-width: 150px;
  `,
  link: css`
    color: ${theme.isDark ? theme.colors.text.link : theme.colors.text.secondary};
  `,
});

const FeaturesBanner = () => {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.whatYouCanDoContainer}>
      <h2 className={cx(styles.heading, styles.whatYouCanDoHeader)}>What you can do</h2>
      <div className={styles.mediumMarginBottom}>
        <a
          href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Read more in Synthetic Monitoring docs &gt;
        </a>
      </div>
      <div className={styles.featuresContainer}>
        <HorizontalGroup spacing="lg" align="center">
          <img src={config.theme2.isDark ? checkSquare : checkSquareLight} />
          <span className={styles.text}>
            Create checks to monitor your services from Grafana hosted or private probes
          </span>
          <img src={dividingLine} className={styles.divider} />
        </HorizontalGroup>
        <HorizontalGroup spacing="lg" align="center">
          <img src={config.theme2.isDark ? welcomeGraph : welcomeGraphLight} />
          <span className={styles.text}>Visualize and query metrics and logs using pre-built dashboards</span>
          <img src={dividingLine} className={styles.divider} />
        </HorizontalGroup>
        <HorizontalGroup spacing="lg" align="center">
          <img src={loki} />
          <span className={styles.text}>Troubleshoot issues using log exploration</span>
          <img src={dividingLine} className={styles.divider} />
        </HorizontalGroup>
        <HorizontalGroup spacing="lg" align="center">
          <img src={config.theme2.isDark ? bell : bellLight} />
          <span className={styles.text}>
            Activate pre-built Prometheus style alerts right from the synthetic monitoring UI
          </span>
        </HorizontalGroup>
      </div>
    </div>
  );
};

export default FeaturesBanner;
