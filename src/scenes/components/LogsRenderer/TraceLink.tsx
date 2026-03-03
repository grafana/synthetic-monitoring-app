import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, Stack, Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useTracesDS } from 'hooks/useTracesDS';

const TRACE_LABEL_NAMES = new Set(['trace_id', 'traceID', 'traceId', 'span_id', 'spanID', 'spanId']);

const TRACE_ID_LABEL_NAMES = new Set(['trace_id', 'traceID', 'traceId']);

export function isTraceLabel(labelName: string): boolean {
  return TRACE_LABEL_NAMES.has(labelName);
}

export function isTraceIdLabel(labelName: string): boolean {
  return TRACE_ID_LABEL_NAMES.has(labelName);
}

export function getExploreTraceUrl(datasourceUid: string, traceId: string): string {
  const left = encodeURIComponent(
    JSON.stringify({
      datasource: datasourceUid,
      queries: [
        {
          refId: 'A',
          queryType: 'traceql',
          query: traceId,
        },
      ],
    })
  );

  return `/explore?left=${left}`;
}

interface TraceLinkProps {
  labelName: string;
  labelValue: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const TraceLink = ({ labelName, labelValue, isExpanded, onToggle }: TraceLinkProps) => {
  const tracesDS = useTracesDS();
  const styles = useStyles2(getStyles);
  const isTraceId = TRACE_ID_LABEL_NAMES.has(labelName);
  const canExpand = isTraceId && onToggle;

  if (!tracesDS) {
    return <Tag name={`${labelName}=${labelValue}`} className={styles.tag} />;
  }

  const href = getExploreTraceUrl(tracesDS.uid, labelValue);

  return (
    <Stack direction="row" gap={0.5} alignItems="center">
      <button type="button" onClick={canExpand ? onToggle : undefined} className={styles.tagButton}>
        <Tag
          name={`${labelName}=${labelValue}`}
          className={canExpand ? styles.clickableTag : styles.tag}
          icon={canExpand && isExpanded ? 'angle-down' : canExpand ? 'angle-right' : undefined}
        />
      </button>
      <a href={href} className={styles.exploreLink} title="Open in Explore">
        <IconButton name="external-link-alt" aria-label="Open trace in Explore" size="sm" />
      </a>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    tag: css`
      white-space: break-spaces;
      overflow-wrap: anywhere;
    `,
    tagButton: css`
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
    `,
    clickableTag: css`
      white-space: break-spaces;
      overflow-wrap: anywhere;
      cursor: pointer;

      &:hover {
        opacity: 0.85;
      }
    `,
    exploreLink: css`
      text-decoration: none;
      display: flex;
      align-items: center;

      &:hover {
        text-decoration: none;
      }
    `,
  };
};
