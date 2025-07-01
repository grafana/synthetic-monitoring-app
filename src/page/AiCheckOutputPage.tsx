import React from 'react';
import { Graphin } from '@antv/graphin';
import { NodeData } from '@antv/g6';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { PanelChrome, useStyles2 } from '@grafana/ui';
import { Check } from 'types';
import { PageInsightsSection } from './AiCheckOutputPage/pageInsights';

export function AiCheckOutputPage({ check }: { check: Check }) {
  const styles = useStyles2(getStyles);

  const data = {
    edges: [
      {
        source: '/',
        target: '/login',
      },
      {
        source: '/',
        target: '/admin',
      },
      {
        source: '/login',
        target: '/',
      },
      {
        source: '/admin',
        target: '/',
      },
    ],
    nodes: [
      {
        id: '/',
        data: {
          url: 'https://quickpizza.grafana.com/',
          title: 'QuickPizza',
          web_vitals: {
            lcp: 1964,
          },
          page_insights: {
            url: '',
            score: 0,
            insights_by_category: null,
          },
        },
      },
      {
        id: '/login',
        data: {
          url: 'https://quickpizza.grafana.com/login',
          title: '',
          web_vitals: {
            lcp: 520,
            cls: 0.015405980428059894,
          },
          page_insights: {
            url: '',
            score: 0,
            insights_by_category: null,
          },
        },
      },
      {
        id: '/admin',
        data: {
          url: 'https://quickpizza.grafana.com/admin',
          title: '',
          web_vitals: {
            lcp: 416,
            cls: 0.00034141805436876087,
          },
          page_insights: {
            url: '',
            score: 0,
            insights_by_category: null,
          },
        },
      },
    ],
  };

  const nodeData = data.nodes.map((node, i) => {
    const newNode: NodeData = { id: `${i}`, data: node };
    return newNode;
  });

  return (
    <div className={styles.pageContainer}>
      <PanelChrome title="Explored nodes" description="Nodes explored by the AI agent">
        <Graphin
          id="my-graphin-demo"
          className="my-graphin-container"
          options={{
            data: {
              nodes: data.nodes,
              edges: data.edges,
            },
            node: {
              style: {
                labelText: (d) => d.id,
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
                  let result = `<h4>Custom Content</h4>`;
                  items.forEach((item) => {
                    result += `<p>Type: ${item.data.description}</p>`;
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
      <PageInsightsSection />
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
