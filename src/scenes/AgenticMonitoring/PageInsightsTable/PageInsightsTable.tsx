import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Card, Collapse, PanelChrome, Stack, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { InsightsCategory, NodeData, PageInsightsIssue } from '../types';

export const PageInsightsTable = ({ insights, type }: { insights: NodeData[]; type: InsightsCategory }) => {
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
};

const PageInsightsItem = ({ item, type }: { item: NodeData; type: InsightsCategory }) => {
  const styles = useStyles2(getStyles);
  const [collapsed, setCollapsed] = useState(true);
  const insightsByCategory = item.page_insights.insights_by_category[type];

  const groupedIssues: Map<string, PageInsightsIssue[]> = new Map();
  insightsByCategory.issues.forEach((issue) => {
    const issues = groupedIssues.get(issue.severity) ?? [];
    issues.push(issue);
    groupedIssues.set(issue.severity, issues);
  });

  const [selectedTab, setSelectedTab] = React.useState(groupedIssues.keys().next().value);

  return (
    <Collapse
      className={styles.collapsableSection}
      label={
        <div style={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" justifyContent="center">
            <div style={{ flex: 1, textAlign: 'start' }}>
              <Badge
                text={<div style={{ fontSize: 14 }}>Score: {insightsByCategory.score}</div>}
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
        <p>{insightsByCategory.summary}</p>

        {/* {[...groupedIssues.keys()].map((group, index) => {
          const [groupCollapsed, setGroupCollapsed] = useState(true);

          return (
            <CollapsableSection
              label={group.toUpperCase()}
              isOpen={!groupCollapsed}
              onToggle={() => setGroupCollapsed(!groupCollapsed)}
              key={`group-${index}`}
            >
              {groupedIssues.get(group)?.map((issue, issueIndex) => (
                <Card key={`issue-${issueIndex}`}>
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
            </CollapsableSection>
          );
        })} */}

        <TabsBar>
          {[...groupedIssues.keys()].map((group, index) => {
            return (
              <Tab
                key={index}
                label={`${group.toUpperCase()} (${groupedIssues.get(group)?.length ?? 0})`}
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
    </Collapse>
  );
};

const getScoreBadgeColor = (score: number) => {
  if (score >= 90) {
    return 'green';
  } else if (score >= 50) {
    return 'orange';
  }
  return 'red';
};

const getBadge = (severity: string, index: number, count: number) => {
  return (
    <Badge
      key={`${severity}-${index}`}
      text={`${severity} ${count}`}
      color={getBadgeColor(severity)}
      icon={getBadgeIcon(severity)}
      style={{ marginRight: '8px', marginBottom: '0' }}
    />
  );
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

const getStyles = (theme: GrafanaTheme2) => {
  return {
    collapsableSection: css({
      '> div:last-child': {
        flex: 1,
      },
    }),
  };
};
