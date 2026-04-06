import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface UnattributedMessageProps {
  missingCalNames: string[];
}

export const UnattributedMessage = ({ missingCalNames }: UnattributedMessageProps) => {
  const styles = useStyles2(getStyles);

  if (missingCalNames.length === 0) {
    return null;
  }

  return (
    <span className={styles.message}>
      <Icon name="exclamation-triangle" size="sm" />
      {t('checkList.unattributedMessage.missingLabels', 'Missing cost attribution labels: {{labelList}}', {
        labelList: missingCalNames.join(', '),
      })}
    </span>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  message: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.warning.text,
  }),
});
