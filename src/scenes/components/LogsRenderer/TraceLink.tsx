import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface TraceLinkProps {
  labelName: string;
  labelValue: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  traceExists?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const TraceLink = ({
  labelName,
  labelValue,
  isExpanded,
  onToggle,
  traceExists,
  isLoading,
  isError,
  onRetry,
}: TraceLinkProps) => {
  const styles = useStyles2(getStyles);
  const tagName = `${labelName}=${labelValue}`;

  if (isLoading) {
    return <Tag name={tagName} className={styles.tag} icon="fa fa-spinner" />;
  }

  if (isError) {
    return (
      <button type="button" onClick={() => onRetry?.()} className={styles.tagButton} aria-label="Retry trace lookup">
        <Tag name={tagName} className={styles.clickableTag} icon="sync" />
      </button>
    );
  }

  if (!traceExists) {
    return <Tag name={tagName} className={styles.tag} />;
  }

  return (
    <button type="button" onClick={onToggle} className={styles.tagButton}>
      <Tag name={tagName} className={styles.clickableTag} icon={isExpanded ? 'angle-down' : 'angle-right'} />
    </button>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
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
});
