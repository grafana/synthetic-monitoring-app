import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneFlexItem, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Badge, CollapsableSection, PanelChrome, Stack, useStyles2 } from '@grafana/ui';
import { Graphin } from '@antv/graphin';
import { css } from '@emotion/css';

import { UserJourneyStepIndexed, UserJourneyTest } from '../types';
import { Check } from 'types';
import { NodeData } from 'scenes/AIAGENT/types';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const checkId = model.useCheckId();
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

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
        <div ref={containerRef} key={`${graphinId}-${isMounted}`}>
          {isMounted && (
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
                  layout: {
                    type: 'dagre',
                    rankdir: 'TB', // Top to Bottom
                    align: 'UL',
                    nodesep: 100,
                    ranksep: 150,
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
                            result += `<h4>Global score: ${data.page_insights.score}</h4>`;
                            result += `<p>Accessibility score: ${accessibility.score}</p>`;
                            result += `<p>Content score: ${content.score}</p>`;
                            result += `<p>Reliability score: ${reliability.score}</p>`;
                            result += `<p>Total number of issues: ${
                              content.issues.length + accessibility.issues.length + reliability.issues.length
                            }</p>`;
                          });
                          return result;
                        } catch (error) {
                          console.warn('Error generating tooltip:', error);
                          return '<p>Error loading details</p>';
                        }
                      },
                    },
                  ],
                  behaviors: ['zoom-canvas', 'drag-canvas'],
                  animation: false, // Disable animations to reduce DOM conflicts
                }}
              />
            </ErrorBoundary>
          )}
        </div>
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
  };
};
