import React, { useState } from 'react';

import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneFlexItem, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Badge, Card, CollapsableSection, PanelChrome, Stack, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';

import pageInsights from '../data/example-output.json';
import { InsightsCategory, NodeData, PageInsightsIssue } from '../types';

interface PageInsightsTableState extends SceneObjectState {
  insights: NodeData[];
  type: InsightsCategory;
}

const getScoreBadgeColor = (score: number) => {
  if (score > 90) {
    return 'green';
  } else if (score > 50) {
    return 'orange';
  }
  return 'red';
};

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

export class PageInsightsTable extends SceneObjectBase<PageInsightsTableState> {
  static Component = PageInsightsTableRenderer;

  public constructor(state: PageInsightsTableState) {
    super(state);
  }

  public useInsights() {
    return this.useState().insights;
  }

  public useType() {
    return this.useState().type;
  }
}

function getBadge(severity: string, index: number, count: number) {
  return (
    <Badge
      key={`${severity}-${index}`}
      text={`${severity} ${count}`}
      color={getBadgeColor(severity)}
      icon={getBadgeIcon(severity)}
      style={{ marginRight: '8px', marginBottom: '0' }}
    />
  );
}

function PageInsightsTableRenderer({ model }: SceneComponentProps<PageInsightsTable>) {
  const insights = model.useInsights();
  const type = model.useType();

  const PANEL_TITLE_MAP = {
    accessibility: 'Accessibility',
    content: 'Content',
    reliability: 'Reliability',
  };

  return (
    <div style={{ width: '100%', height: 'auto' }}>
      <PanelChrome title={`${PANEL_TITLE_MAP[type]} issues`}>
        <Stack direction="column">
          {insights.map((item, index) => (
            <PageInsightsItem key={index} item={item} type={type} />
          ))}
        </Stack>
      </PanelChrome>
    </div>
  );
}

function PageInsightsItem({ item, type }: { item: NodeData; type: InsightsCategory }) {
  const styles = useStyles2(getStyles);
  const [collapsed, setCollapsed] = useState(true);
  console.log('item', item);
  console.log('type', type);
  const insightsByCategory = item.page_insights.insights_by_category[type];

  const groupedIssues: Map<string, PageInsightsIssue[]> = new Map();
  insightsByCategory.issues.forEach((issue) => {
    const issues = groupedIssues.get(issue.severity) ?? [];
    issues.push(issue);
    groupedIssues.set(issue.severity, issues);
  });

  const [selectedTab, setSelectedTab] = React.useState(groupedIssues.keys().next().value);

  return (
    <CollapsableSection
      className={styles.collapsableSection}
      label={
        <div style={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" justifyContent="center">
            <div style={{ flex: 1, textAlign: 'start' }}>
              <Badge
                text={<div style={{ fontSize: 16 }}>Score: {insightsByCategory.score}</div>}
                color={getScoreBadgeColor(insightsByCategory.score)}
                style={{ marginRight: '8px' }}
              />
              {item.url.replace('https://', '')}
            </div>
            <div>
              {[...groupedIssues.keys()].map((group, groupIndex) =>
                getBadge(group, groupIndex, groupedIssues.get(group)?.length ?? 0)
              )}
            </div>
          </Stack>
        </div>
      }
      isOpen={!collapsed}
      onToggle={() => setCollapsed(!collapsed)}
    >
      <div style={{ paddingLeft: '32px', paddingRight: '16px' }}>
        <h5>Summary</h5>
        <p>{insightsByCategory.summary}</p>

        {/* <h5>Issues</h5> */}

        <TabsBar>
          {[...groupedIssues.keys()].map((group, index) => {
            return (
              <Tab
                key={index}
                label={group.toUpperCase()}
                active={group === selectedTab}
                onChangeTab={() => setSelectedTab(group)}
              />
            );
          })}
        </TabsBar>
        <TabContent>
          {groupedIssues.get(selectedTab!)?.map((issue, issueIndex) => (
            <Card key={`card-${issueIndex}`}>
              <Card.Heading>{issue.reason}</Card.Heading>
              <Card.Description>
                <div>
                  <strong>Description:</strong> {issue.description}
                </div>
                <div>
                  <strong>Recommendation:</strong> {issue.recommendation}
                </div>
              </Card.Description>
            </Card>
          ))}
        </TabContent>
      </div>
    </CollapsableSection>
  );
}
export function getPageInsightsTable(type: InsightsCategory): SceneFlexItem {
  return new SceneFlexItem({
    body: new PageInsightsTable({
      insights: pageInsights.nodes.map((node) => node.data),
      type: type,
    }),
  });
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    collapsableSection: css({
      '> div:last-child': {
        flex: 1,
      },
    }),
  };
};
