import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, ClipboardButton, Icon, Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDate } from 'utils';
import { ExperimentalSecret } from 'data/useSecrets';

interface SecretCardProps {
  secret: ExperimentalSecret;
  onEdit: (id?: ExperimentalSecret['uuid']) => void;
  onDelete: (id: ExperimentalSecret['uuid']) => void;
}

export function SecretCard({ secret, onEdit, onDelete }: SecretCardProps) {
  const styles = useStyles2(getStyles);
  const handleEdit = () => {
    onEdit(secret.uuid);
  };

  const handleDelete = () => {
    onDelete(secret.uuid);
  };

  const handleEnter = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      handleEdit();
    }
  };

  return (
    <div tabIndex={0} className={styles.card} onKeyUp={handleEnter}>
      <div className={styles.heading}>
        <h4>{secret.name}</h4>
        <div className={styles.tagsContainer}>
          {secret.labels?.map((label) => (
            <Tag key={label.name} colorIndex={3} name={`${label.name}: ${label.value}`} />
          ))}
        </div>
        <div className={styles.actions}>
          <Button size="sm" icon="edit" fill="outline" variant="secondary" onClick={handleEdit}>
            Edit
          </Button>
          <Button size="sm" icon="trash-alt" variant="secondary" onClick={handleDelete} />
        </div>
      </div>
      <div className={styles.keyValue}>
        <strong>ID:</strong> {secret.uuid}{' '}
        <ClipboardButton
          className={styles.copyButton}
          variant="secondary"
          size="sm"
          fill="text"
          getText={() => secret.uuid}
        >
          <Icon name="copy" />
        </ClipboardButton>
      </div>
      <div className={styles.keyValue}>
        <strong>Description:</strong> {secret.description}
      </div>
      <div className={styles.keyValue}>
        <strong>Created:</strong> {formatDate(secret.created_at)} ({secret.created_by})
      </div>
      {/* Currently there is no modified_at returned by the API(???) */}
      {/*<div className={styles.keyValue}>*/}
      {/*  <strong>Modified:</strong> {formatDate(secret.modified_at)}*/}
      {/*</div>*/}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css`
    background-color: ${theme.colors.background.secondary};
    padding: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(2)};
  `,
  keyValue: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
    display: flex;
    align-items: center;
    min-height: 24px; // sm button height
    gap: ${theme.spacing(1)};

    & > strong {
      color: ${theme.colors.text.primary};
    }
  `,
  tagsContainer: css`
    display: flex;
    gap: ${theme.spacing(0.5)};
    flex: 1 0 auto;
    margin-right: 90px; // actions width + gap
  `,
  heading: css`
    display: flex;
    gap: ${theme.spacing(2)}; // container padding
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(1.5)};
    position: relative;

    & > h4 {
      margin: 0;
    }
  `,
  actions: css`
    display: flex;
    gap: ${theme.spacing(1)};
    position: absolute;
    right: 0;
    top: 0;
  `,
  copyButton: css`
    padding: 2px;
  `,
});
