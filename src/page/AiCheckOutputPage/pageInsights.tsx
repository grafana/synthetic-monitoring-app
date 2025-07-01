import React, { useState } from 'react';

import { Badge, Collapse, Table, useStyles2 } from '@grafana/ui';

import pageInsights from '../../scenes/AIAGENT/data/example-output.json';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

import { getPageInsightsTable } from '../../scenes/AIAGENT/pageInsightsTable';

export function Header({ title, stats }: { title: string; stats?: Map<string, number> }) {
  const styles = useStyles2(getStyles);

  const getBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'purple';
    }
  };
  const getBadgeIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'exclamation-circle';
      case 'high':
        return 'exclamation-circle';
      case 'medium':
        return 'exclamation-triangle';
      case 'low':
        return 'info-circle';
      default:
        return 'circle';
    }
  };
  return (
    <div className={styles.headerContainer}>
      <h2 className={styles.header}>{title}</h2>
      {stats?.size && (
        <div>
          {[...stats.keys()].map((severity: string, index: number) => (
            <Badge
              key={`${severity}-${index}`}
              text={`${severity} ${stats.get(severity)}`}
              color={getBadgeColor(severity)}
              icon={getBadgeIcon(severity)}
              style={{ marginRight: '8px', marginBottom: '8px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageInsightsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const accessibilityStats: Map<string, number> = new Map();
  const contentStats: Map<string, number> = new Map();

  pageInsights.nodes.forEach((node) => {
    node.data.page_insights.insights_by_category.accessibility.issues.forEach((issue) => {
      if (accessibilityStats.has(issue.severity)) {
        accessibilityStats.set(issue.severity, accessibilityStats.get(issue.severity)! + 1);
      }
      accessibilityStats.set(issue.severity, 1);
    });
    node.data.page_insights.insights_by_category.content.issues.forEach((issue) => {
      if (contentStats.has(issue.severity)) {
        contentStats.set(issue.severity, contentStats.get(issue.severity)! + 1);
      }
      contentStats.set(issue.severity, 1);
    });
  });
  console.log('accessibilityStats:', accessibilityStats);

  return (
    <>
      <h1>Page Insights</h1>
      <Collapse
        label={<Header title="Accessiblity" stats={accessibilityStats} />}
        collapsible={true}
        isOpen={isOpen}
        onToggle={(isOpen) => {
          setIsOpen(isOpen);
        }}
      >
        {/* {getPageInsightsTable()} */}
      </Collapse>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    headerContainer: css({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      textAlign: 'center',
      width: '100%',
    }),
    header: css({
      margin: 0,
    }),
    headerBadges: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    }),
  };
};
