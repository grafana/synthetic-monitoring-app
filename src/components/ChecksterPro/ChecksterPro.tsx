import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Icon, IconButton, Link, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ChecksterType } from './types';

import { BigNumber } from './components/BigNumber';
import { Tabs } from './components/Tabs';
import { RequestTab } from './tabs/RequestTab';
import { useActiveTab } from './hooks';

interface ChecksterProProps {
  type?: ChecksterType;
}

const tabs = [
  { label: 'Request' },
  { label: 'Locations', counter: 3 },
  { label: 'Labels', counter: 2 },
  { label: 'Assertions', count: 3 },
  { label: 'Frequency' },
  { label: 'Overview' },
];

const tabMap = {
  Request: RequestTab,
} as const;

export function ChecksterPro(props: ChecksterProProps) {
  const styles = useStyles2(getStyles);

  const [activeTab, setActiveTab] = useActiveTab(tabs[0].label);
  // const [activeTab, setActiveTab] = useState(tabs[0].label);

  if (tabMap.hasOwnProperty(activeTab)) {
    //@ts-expect-error - activeTab is a key of tabMap
    const TabComponent = tabMap[activeTab];

    return (
      <div className={styles.container}>
        <Text color="secondary">Job</Text>
        <h1>
          http-check-2025-02-02 01:34:23 <Icon name="unlock" />
        </h1>
        <Tabs tabs={tabs} activeTab={activeTab} onChangeTab={setActiveTab} />
        <div className={styles.tabContent}></div>
        <TabComponent />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Text color="secondary">Job</Text>
      <h1>
        http-check-2025-02-02 01:34:23 <Icon name="lock" />
      </h1>
      <Tabs tabs={tabs} activeTab={activeTab} onChangeTab={setActiveTab} />
      <h2>Overview</h2>
      <div>
        <h5>Estimated usage for this check</h5>
        <div className={styles.calcListContainer}>
          {/*<BigNumber title="Data points" subTitle="per execution" value="34" />*/}
          <BigNumber title="Executions" subTitle="/month" value="267,840" />
          <BigNumber title="Data points" subTitle="per minute" value="204" />
          <BigNumber title="Active" subTitle="series" value="34" />
          <BigNumber title="Log usage" subTitle="/month" value="0.21" unit="GB" />
        </div>
      </div>
      <div>
        <div className={styles.wrapper}>
          <div>
            <h4>Request</h4>
            <div className={styles.item}>
              <div className={styles.requestType}>GET</div>
              <div>https://www.grafana.com/synthetic-monitoring/bo...</div>
              <div className={styles.badgeContainer}>
                <Badge icon="fire" text="Full set of metrics" color="red" />
                <Badge text="Headers (3)" color="blue" />
                <Badge text="Authentication (Bearer)" color="orange" />
                <Badge text="Proxy" color="purple" />
              </div>
              <IconButton aria-label="Configure" name="cog" />
            </div>
          </div>

          <br />

          <h4>Locations</h4>
          <div className={styles.item}>
            <div>
              <Icon name="globe" size="lg" />
            </div>
            <div className={styles.badgeContainer}>
              <Badge color="green" text="Oregon, US (AWS)" />
              <Badge color="green" text="grpc-master-eu" />
              <Badge color="red" text="p-NADIA-be-long-probe-name-thats" />
            </div>
            <IconButton aria-label="Configure" name="cog" />
          </div>
          <div className={styles.sectionError}>
            One of your <Link href="#private-probes">private probes</Link> seems to be offline.
          </div>

          <br />

          <h4>Labels</h4>
          <div className={styles.item}>
            <div>
              <Icon name="tag-alt" size="lg" />
            </div>
            <div className={styles.badgeContainer}>
              <Badge color="purple" text="env: prod" />
              <Badge color="purple" text="service: front-end" />
            </div>
            <IconButton aria-label="Configure" name="cog" />
          </div>
          <br />

          <h4>Assertions</h4>
          <div className={styles.item}>
            <div>
              <Icon name="thumbs-up" size="lg" />
            </div>
            <div>
              <div>
                WHEN <code>status code</code> is one of <code>200, 201, 302</code>{' '}
                <IconButton aria-label="Configure" name="cog" />
              </div>
              <div>
                AND <code>HTTP version</code> is <code>HTTP/1.0</code>
              </div>
              <div>
                AND <code>SSL</code> is <code>true</code>
              </div>
              <div>
                WITHIN <code>30s</code>
              </div>
            </div>
          </div>
          <br />

          <h4>Frequency</h4>
          <div className={styles.item}>
            <div>
              <Icon name="clock-nine" size="lg" />
            </div>
            <div className={styles.badgeContainer}>
              Run every <code>5m</code>
            </div>
            <IconButton aria-label="Configure" name="cog" />
          </div>
          <br />
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    container-type: inline-size;
    padding: ${theme.spacing(2)};
    background-color: ${theme.colors.background.primary};
  `,
  item: css`
    display: flex;
    padding: ${theme.spacing(1)};
    background-color: ${theme.colors.background.secondary};
    gap: ${theme.spacing(1)};
  `,
  requestType: css`
    color: ${theme.visualization.getColorByName('green')};
    font-weight: bold;
  `,
  badgeContainer: css`
    display: flex;
    gap: ${theme.spacing(0.5)};
  `,
  wrapper: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  `,
  calcListContainer: css`
    display: grid;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(1)};
    grid-template-columns: repeat(1, minmax(150px, 1fr));

    @container (min-width: 480px) {
      grid-template-columns: repeat(2, minmax(150px, 1fr));
    }

    @container (min-width: 650px) {
      grid-template-columns: repeat(4, minmax(150px, 1fr));
    }
  `,
  tabContent: css`
    padding: ${theme.spacing(2)};
  `,
  sectionError: css`
    margin-top: ${theme.spacing(0.25)};
    border-left: 4px solid ${theme.colors.warning.border};
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    color: ${theme.colors.warning.text};
    background-color: ${theme.colors.warning.transparent};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});
