import React, { ReactNode, useId, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

type OptionalInputProps = {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  isOpen?: boolean;
};

export const OptionalInput = ({ children, disabled, label, isOpen = false }: OptionalInputProps) => {
  const styles = useStyles2(getStyles);
  const [include, setInclude] = useState(isOpen);
  const id = useId();

  return (
    <div className={styles.stackCol}>
      <HorizontalCheckboxField
        label={label}
        id={id}
        disabled={disabled}
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
