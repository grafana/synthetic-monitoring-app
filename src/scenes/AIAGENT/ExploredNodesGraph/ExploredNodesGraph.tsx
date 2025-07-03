import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Graphin } from '@antv/graphin';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneFlexItem, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { LegendDisplayMode, PanelChrome, Stack, useStyles2, VizLegend } from '@grafana/ui';

import { NodeData } from 'scenes/AIAGENT/types';
import { UserJourneyTest } from '../types';

import pageInsights from '../data/example-output.json';
import userJourneyTests from '../data/user-journeys.json';

function getNodeColor(score: number) {
  if (score > 80) {
    return '#83bd71'; // green
  } else if (score > 50) {
    return '#f19e45'; // yellow
  }
  return '#e1575e'; // red
}

interface ExploredNodesGraphState extends SceneObjectState {
  checkId: number;
  userJourneyTests: UserJourneyTest[];
  pageInsights: any;
}

export class ExploredNodesGraph extends SceneObjectBase<ExploredNodesGraphState> {
  static Component = ExploredNodesGraphRenderer;

  public constructor(state: ExploredNodesGraphState) {
    super(state);
  }

  public useCheckId() {
    return this.useState().checkId;
  }
  public useUserJourneyTests() {
    return this.useState().userJourneyTests;
  }
  public usePageInsights() {
    return this.useState().pageInsights;
  }
}

function ExploredNodesGraphRenderer({ model }: SceneComponentProps<ExploredNodesGraph>) {
  const styles = useStyles2(getStyles);
  const graphinRef = useRef<any>(null);
  const checkId = model.useCheckId();
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [focusedJourney, setFocusedJourney] = useState<UserJourneyTest | undefined>(undefined);

  // Create a unique ID based on the check ID to avoid conflicts
  const graphinId = `ai-check-graph-${checkId}`;

  const cleanupGraphin = useCallback(() => {
    if (graphinRef.current) {
      try {
        // Try multiple cleanup methods that might exist
        if (typeof graphinRef.current.destroy === 'function') {
          graphinRef.current.destroy();
        } else if (typeof graphinRef.current.clear === 'function') {
          graphinRef.current.clear();
        } else if (typeof graphinRef.current.dispose === 'function') {
          graphinRef.current.dispose();
        }
      } catch (error) {
        console.warn('Error cleaning up Graphin instance:', error);
        // Don't rethrow, just log it
      } finally {
        graphinRef.current = null;
      }
    }
  }, []);

  // Mount the component after a small delay to ensure DOM is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setIsMounted(false);
      cleanupGraphin();
    };
  }, [cleanupGraphin]);

  // Cleanup on check change
  useEffect(() => {
    return () => {
      cleanupGraphin();
    };
  }, [checkId, cleanupGraphin]);

  const handleGraphinError = useCallback((error: any) => {
    console.error('Graphin error:', error);
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className={styles.pageContainer}>
        <PanelChrome title="Explored nodes" description="Nodes explored by the AI agent">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Unable to render the graph visualization. Please refresh the page to try again.</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsMounted(false);
                setTimeout(() => setIsMounted(true), 100);
              }}
              style={{ marginTop: '10px', padding: '8px 16px' }}
            >
              Retry
            </button>
          </div>
        </PanelChrome>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <PanelChrome title="Explored nodes" description="Nodes explored by the AI agent">
        <Stack key={`${graphinId}-${isMounted}`} direction="row">
          {isMounted && (
            <div style={{ flexGrow: 1 }}>
              <ErrorBoundary onError={handleGraphinError}>
                <Graphin
                  ref={graphinRef}
                  id={graphinId}
                  className="ai-check-graphin-container"
                  options={{
                    data: {
                      nodes: pageInsights.nodes,
                      edges: pageInsights.edges,
                    },
                    node: {
                      type: 'html',
                      style: {
                        size: [100, 100],
                        dx: -50,
                        dy: -50,
                        innerHTML: (node: any) => {
                          try {
                            const data = node.data as NodeData;
                            const color = getNodeColor(data.page_insights?.score);
                            return `<div style="padding: 16px; background-color: ${color}; border-radius: 100px; color: white; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                      <div><strong>${node.id}</strong></div>
                                      <div>Score: ${data.page_insights?.score}</div>      
                                    </div>`;
                          } catch (error) {
                            console.warn('Error rendering node:', error);
                            return '<div style="padding: 16px; background-color: #ccc; border-radius: 100px; color: black;">Error</div>';
                          }
                        },
                      },
                    },
                    edge: {
                      type: 'line',
                      style: styles.edge,
                    },
                    layout: {
                      type: 'force',
                      preventOverlap: true,
                      linkDistance: 100,
                    },
                    plugins: [
                      {
                        type: 'tooltip',
                        trigger: 'click',
                        getContent: (e: any, items: any[]) => {
                          try {
                            let result = '';
                            items.forEach((node) => {
                              const data = node.data as NodeData;
                              const accessibility = data.page_insights.insights_by_category.accessibility;
                              const content = data.page_insights.insights_by_category.content;
                              const reliability = data.page_insights.insights_by_category.reliability;
                              result += `<h4 style="color: ${getNodeColor(data.page_insights.score)}">Global score: ${
                                data.page_insights.score
                              }</h4>`;
                              result += `<h6>Score by category</h6>`;
                              result += `<p style="margin: 0 0 4px 0;">`;
                              result += `<span style="color: ${getNodeColor(
                                accessibility.score
                              )};font-weight: bold;">Accessibility: ${accessibility.score}</span> (${getTextIssue(
                                accessibility.issues.length
                              )})<br />`;
                              result += `<span style="color: ${getNodeColor(
                                content.score
                              )};font-weight: bold;">Content: ${content.score}</span> (${getTextIssue(
                                content.issues.length
                              )})<br />`;
                              result += `<span style="color: ${getNodeColor(
                                reliability.score
                              )};font-weight: bold;">Reliability: ${reliability.score}</span> (${getTextIssue(
                                reliability.issues.length
                              )})`;
                              result += `</p>`;
                              result += `<h6>Web vitals</h6>`;
                              result += `<p style="margin: 0 0 4px 0;">`;
                              result += `<span style="font-weight: bold;">Time to First Byte:</span> ${Math.trunc(
                                data.web_vitals.ttfb
                              )}<br />`;
                              result += `<span style="font-weight: bold;">Largest Contentful Paint:</span> ${Math.trunc(
                                data.web_vitals.lcp
                              )}<br />`;
                              result += `<span style="font-weight: bold;">Cumulative Layout Shift:</span> ${Math.trunc(
                                data.web_vitals.cls
                              )}<br />`;
                              result += `<span style="font-weight: bold;">First Contentful Paint:</span> ${Math.trunc(
                                data.web_vitals.fcp
                              )}<br />`;
                              result += `</p>`;
                            });
                            return `<div style="font-family:Inter,Helvetica,Arial,sans-serif;">${result}</div>`;
                          } catch (error) {
                            console.warn('Error generating tooltip:', error);
                            return '<p>Error loading details</p>';
                          }
                        },
                      },
                      {
                        type: 'grid-line',
                        follow: {
                          translate: false, // Do not follow translation
                          zoom: true, // Follow zoom
                        },
                        lineWidth: 1,
                        stroke: styles.gridLine,
                        border: false,
                      },
                      ...(focusedJourney
                        ? [
                            {
                              type: 'hull',
                              key: focusedJourney.user_flow.title,
                              members: pageInsights.nodes
                                .filter((node) => focusedJourney.steps.some((step) => step.url === node.data.url))
                                .map((node) => node.id),
                            },
                          ]
                        : []),
                    ],
                    behaviors: ['zoom-canvas', 'drag-canvas'],
                    animation: false, // Disable animations to reduce DOM conflicts
                  }}
                />
              </ErrorBoundary>
            </div>
          )}
          {userJourneyTests.length > 0 && (
            <div style={{ minWidth: 300 }}>
              <h6>User Journeys</h6>

              <Stack direction="column" gap={0}>
                <VizLegend
                  items={userJourneyTests.map((journey, index) => ({
                    label: journey.user_flow.title,
                    data: journey,
                    color: journey.success ? '#83bd71' : '#e1575e',
                    yAxis: 1,
                    disabled: focusedJourney && focusedJourney.user_flow.title !== journey.user_flow.title,
                  }))}
                  displayMode={LegendDisplayMode.Table}
                  placement="right"
                  onLabelClick={(item) =>
                    setFocusedJourney(
                      focusedJourney && focusedJourney.user_flow.title === item.data?.user_flow.title
                        ? undefined
                        : (item.data as UserJourneyTest)
                    )
                  }
                />
              </Stack>
            </div>
          )}
        </Stack>
      </PanelChrome>
      {/* <PageInsightsSection /> */}
    </div>
  );
}

export function getExploredNodesGraph(checkId: number) {
  return new SceneFlexItem({
    body: new ExploredNodesGraph({
      checkId: checkId,
      userJourneyTests: userJourneyTests,
      pageInsights: pageInsights,
    }),
  });
}

// Simple Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: any) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: any) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent handle the error display
    }

    return this.props.children;
  }
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    pageContainer: css({
      label: 'page-container',
      borderBottom: 'none',
      background: theme.colors.background.primary,
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      margin: theme.spacing(0, 0, 0, 0),
    }),
    label: {
      color: theme.colors.text.primary,
    },
    journey: css`
      border-top: 1px solid ${theme.colors.border.medium};
      border-bottom: 1px solid ${theme.colors.border.medium};
      color: ${theme.colors.text.maxContrast};
      line-height: 20px;
      padding: ${theme.spacing(1)};
    `,
    gridLine: theme.colors.border.weak,
    edge: {
      stroke: theme.colors.border.strong,
      strokeWidth: 1,
    },
  };
};

function getTextIssue(count: number): string {
  if (count === 0) {
    return 'No issue';
  }
  if (count === 1) {
    return '1 issue';
  }
  return `${count} issues`;
}
