import React, { ReactNode, useId, useState } from 'react';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { hasRole } from 'utils';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

type OptionalInputProps = {
  children: ReactNode;
  label: string;
  isOpen?: boolean;
};

export const OptionalInput = ({ children, label, isOpen = false }: OptionalInputProps) => {
  const styles = useStyles2(getStyles);
  const [include, setInclude] = useState(isOpen);
  const id = useId();
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <div className={styles.stackCol}>
      <HorizontalCheckboxField
        label={label}
        id={id}
        disabled={!isEditor}
        value={include}
        onChange={() => setInclude(!include)}
      />
      <div className={cx({ [styles.hide]: !include })}>{children}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    stackCol: css({
      display: `flex`,
      flexDirection: `column`,
      gap: theme.spacing(1),
    }),
    hide: css({
      display: `none`,
    }),
  };
};
