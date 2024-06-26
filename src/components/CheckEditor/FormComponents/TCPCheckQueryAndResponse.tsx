import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, Field, IconButton, Input, Switch, TextArea, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesTcp } from 'types';
import { hasRole } from 'utils';

export const TCPCheckQueryAndResponse = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const styles = useStyles2(getStyles);
  const { register, control } = useFormContext<CheckFormValuesTcp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesTcp>({ control, name: 'settings.tcp.queryResponse' });

  return (
    <Field
      label="Query and response"
      description="The query sent in the TCP probe and the expected associated response. StartTLS upgrades TCP connection to TLS."
      disabled={!isEditor}
    >
      <div className={styles.stackCol}>
        {fields.map((field, index) => {
          const startTLSId = `tcp-settings-query-response-start-tls-${index}`;

          return (
            <div className={styles.stack} key={field.id}>
              <Input
                {...register(`settings.tcp.queryResponse.${index}.expect`)}
                type="text"
                placeholder="Response to expect"
                disabled={!isEditor}
                data-fs-element="TCP query response expect input"
              />
              <TextArea
                {...register(`settings.tcp.queryResponse.${index}.send`)}
                type="text"
                placeholder="Data to send"
                rows={1}
                disabled={!isEditor}
                data-fs-element="TCP query response send textarea"
              />
              <div className={styles.stack}>
                <Field label="StartTLS" htmlFor={startTLSId} className={styles.switchField}>
                  <Switch
                    {...register(`settings.tcp.queryResponse.${index}.startTLS` as const)}
                    label="StartTLS"
                    disabled={!isEditor}
                    id={startTLSId}
                    data-fs-element="TCP start TLS switch"
                  />
                </Field>
              </div>
              <IconButton
                name="minus-circle"
                onClick={() => remove(index)}
                disabled={!isEditor}
                tooltip="Delete"
                data-fs-element="Delete query and response validation button"
              />
            </div>
          );
        })}
        <div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => append({ expect: '', send: '', startTLS: false })}
            disabled={!isEditor}
            data-fs-element="Add query response validation button"
          >
            Add query/response
          </Button>
        </div>
      </div>
    </Field>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stack: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: `center`,
  }),
  stackCol: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  switchField: css({
    margin: 0,
    flexDirection: 'row',
    gap: theme.spacing(1),
  }),
});
