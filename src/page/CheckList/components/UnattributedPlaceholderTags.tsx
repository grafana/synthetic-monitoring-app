import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ACTIVE_UNATTRIBUTED_MODES } from 'page/CheckList/CheckList.constants';

interface UnattributedPlaceholderTagsProps {
  missingCalNames: string[];
}

export const UnattributedPlaceholderTags = ({ missingCalNames }: UnattributedPlaceholderTagsProps) => {
  const styles = useStyles2(getStyles);

  if (!ACTIVE_UNATTRIBUTED_MODES.has('placeholder-tag') || missingCalNames.length === 0) {
    return null;
  }

  return (
    <>
      {missingCalNames.map((name) => (
        <span key={`placeholder-${name}`} className={styles.placeholderTag}>
          <Tag name={`${name}: —`} colorIndex={17} />
        </span>
      ))}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  placeholderTag: css({
    opacity: 0.6,
    borderStyle: 'dashed',
  }),
});
