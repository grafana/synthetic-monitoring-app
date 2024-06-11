import React, { createContext, ReactNode, useId } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

type SharedProps = Record<string, any> & {
  label?: string;
  description?: string;
};

type ContextProps = SharedProps;

export const RequestFieldContext = createContext<ContextProps>({});

type RequestFieldProps = SharedProps & {
  children: ReactNode;
};

export const RequestField = ({ children, description, label = `Request target`, ...rest }: RequestFieldProps) => {
  const styles = useStyles2(getStyles);
  const id = useId().replace(/:/g, '_');

  return (
    <RequestFieldContext.Provider value={{ id, ...rest }}>
      <Field className={styles.stack} description={description} label={label}>
        <div className={styles.wrapper}>{children}</div>
      </Field>
    </RequestFieldContext.Provider>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stack: css({
    margin: 0,
  }),
  wrapper: css({
    display: `flex`,

    '> :first-child': {
      flex: 1,
    },
  }),
});
