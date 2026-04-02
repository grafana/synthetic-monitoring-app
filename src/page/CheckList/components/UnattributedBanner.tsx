import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ACTIVE_UNATTRIBUTED_MODES } from 'page/CheckList/CheckList.constants';

interface UnattributedBannerProps {
  unattributedCount: number;
  totalCount: number;
  onShowUnattributed?: () => void;
}

export const UnattributedBanner = ({ unattributedCount, totalCount, onShowUnattributed }: UnattributedBannerProps) => {
  const styles = useStyles2(getStyles);

  if (!ACTIVE_UNATTRIBUTED_MODES.has('banner') || unattributedCount === 0) {
    return null;
  }

  return (
    <Alert severity="warning" title="" className={styles.banner}>
      <div className={styles.content}>
        <span>
          {unattributedCount} of {totalCount} check{totalCount === 1 ? '' : 's'} ha
          {unattributedCount === 1 ? 's' : 've'} missing cost attribution labels
        </span>
        {onShowUnattributed && (
          <Button variant="secondary" size="sm" onClick={onShowUnattributed}>
            Show unattributed
          </Button>
        )}
      </div>
    </Alert>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  banner: css({
    marginBottom: theme.spacing(1),
  }),
  content: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
  }),
});
