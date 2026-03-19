import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneContextProvider } from '@grafana/scenes-react';
import { LoadingPlaceholder, Pagination, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { SyntheticChecksPanelProps } from './SyntheticChecksPanel.types';
import { PLUGIN_URL_PATH } from 'routing/constants';
import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

import { useChecksForUrl } from './SyntheticChecksPanel.hooks';
import { SyntheticChecksPanelChart } from './SyntheticChecksPanelChart';
import { SyntheticChecksPanelRow } from './SyntheticChecksPanelRow';

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_TITLE = 'Synthetic checks';

export const SyntheticChecksPanel = ({
  urls,
  timeRange,
  title = DEFAULT_TITLE,
  showSeeAllLink = true,
  pageSize = DEFAULT_PAGE_SIZE,
}: SyntheticChecksPanelProps) => {
  const styles = useStyles2(getStyles);
  const url = urls[0];
  const { data: matchedChecks, isLoading } = useChecksForUrl({ url, timeRange });
  const [currentPage, setCurrentPage] = useState(1);

  const sceneTimeRange = useMemo(() => {
    if (timeRange) {
      return { from: new Date(timeRange.from * 1000).toISOString(), to: new Date(timeRange.to * 1000).toISOString() };
    }

    return { from: `now-${DEFAULT_QUERY_FROM_TIME}`, to: 'now' };
  }, [timeRange]);

  const totalPages = Math.max(1, Math.ceil(matchedChecks.length / pageSize));
  const paginatedChecks = matchedChecks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingPlaceholder text="Loading checks..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h6 className={styles.title}>{title}</h6>
        {showSeeAllLink && (
          <TextLink href={`${PLUGIN_URL_PATH}checks`} inline={false}>
            See all
          </TextLink>
        )}
      </div>

      {matchedChecks.length === 0 ? (
        <div className={styles.emptyState}>No checks found.</div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.nameHeader}>Name</th>
                <th className={styles.metricHeader}>Uptime</th>
                <th className={styles.metricHeader}>Reachability</th>
                <th className={styles.metricHeader}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChecks.map((check) => (
                <SyntheticChecksPanelRow key={check.id} check={check} />
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Pagination
                currentPage={currentPage}
                numberOfPages={totalPages}
                onNavigate={setCurrentPage}
              />
            </div>
          )}

          <SceneContextProvider timeRange={sceneTimeRange} withQueryController>
            <SyntheticChecksPanelChart checks={matchedChecks} />
          </SceneContextProvider>
        </>
      )}
    </div>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      border: `1px solid ${theme.components.panel.borderColor}`,
      borderRadius: theme.shape.radius.default,
      backgroundColor: theme.colors.background.primary,
    }),
    header: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(1.5),
    }),
    title: css({
      margin: 0,
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.h6.fontWeight,
    }),
    table: css({
      width: '100%',
      borderCollapse: 'collapse',
    }),
    nameHeader: css({
      padding: theme.spacing(0.5, 1.5),
      textAlign: 'left',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.secondary,
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    }),
    metricHeader: css({
      padding: theme.spacing(0.5, 1.5),
      textAlign: 'right',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.secondary,
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    }),
    emptyState: css({
      padding: theme.spacing(4),
      textAlign: 'center',
      color: theme.colors.text.secondary,
    }),
    pagination: css({
      display: 'flex',
      justifyContent: 'flex-end',
      padding: theme.spacing(1),
    }),
  };
}
