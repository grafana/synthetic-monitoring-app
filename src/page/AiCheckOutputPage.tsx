import React from 'react';
import { Graphin } from '@antv/graphin';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { PanelChrome, useStyles2 } from '@grafana/ui';
import { Check } from 'types';

import pageInsights from '../scenes/AIAGENT/data/example-output.json';
import { NodeData } from 'scenes/AIAGENT/types';

function getNodeColor(score: number) {
  if (score > 80) {
    return '#52c41a'; // green
  } else if (score > 50) {
    return '#faad14'; // yellow
  }
  return '#f5222d'; // red
}

export function AiCheckOutputPage({ check }: { check: Check }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.pageContainer}>
      <PanelChrome title="Explored nodes" description="Nodes explored by the AI agent">
        <Graphin
          id="my-graphin-demo"
          className="my-graphin-container"
          options={{
            data: {
              nodes: pageInsights.nodes,
              edges: pageInsights.edges,
            },
            node: {
              type: 'html',
              style: {
                size: [100, 100],
                innerHTML: (node: any) => {
                  const data = node.data as NodeData;
                  const color = getNodeColor(data.page_insights?.score);
                  return `<div style="padding: 16px; background-color: ${color}; border-radius: 100px; color: white; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <div><strong>${node.id}</strong></div>
                            <div>Score: ${data.page_insights?.score}</div>      
                          </div>`;
                },
              },
            },
            layout: {
              type: 'grid',
              collide: {
                strength: 0.5,
              },
            },
            plugins: [
              {
                type: 'tooltip',
                trigger: 'click',
                getContent: (e: any, items: any[]) => {
                  let result = '';
                  items.forEach((node) => {
                    const data = node.data as NodeData;
                    const accessibility = data.page_insights.insights_by_category.accessibility;
                    const content = data.page_insights.insights_by_category.content;
                    result += `<h4>Global score: ${data.page_insights.score}</h4>`;
                    result += `<p>Accessibility score: ${accessibility.score}</p>`;
                    result += `<p>Content score: ${content.score}</p>`;
                    result += `<p>Total number of issues: ${content.issues.length + accessibility.issues.length}</p>`;
                  });
                  return result;
                },
              },
            ],
            behaviors: ['zoom-canvas', 'drag-canvas'],
            animation: true,
          }}
        ></Graphin>
      </PanelChrome>
      {/* <PageInsightsSection /> */}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    pageContainer: css({
      label: 'page-container',
      padding: theme.spacing(0, 2, 2, 2),
      borderBottom: 'none',
      background: theme.colors.background.primary,
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      margin: theme.spacing(0, 0, 0, 0),

      [theme.breakpoints.up('md')]: {
        padding: theme.spacing(0, 4, 4, 4),
      },
    }),
    label: {
      color: theme.colors.text.primary,
    },
  };
};
