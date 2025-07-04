import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, IconButton, Input, Stack, Switch, TextArea, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesTcp } from 'types';

export const TCPCheckQueryAndResponse = () => {
  const styles = useStyles2(getStyles);
  const {
    register,
    control,
    formState: { disabled: isFormDisabled },
  } = useFormContext<CheckFormValuesTcp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesTcp>({ control, name: 'settings.tcp.queryResponse' });

  return (
    <Field
      label="Query and response"
      description="The query sent in the TCP probe and the expected associated response. StartTLS upgrades TCP connection to TLS."
    >
      <Stack direction={`column`}>
        {fields.map((field, index) => {
          const startTLSId = `tcp-settings-query-response-start-tls-${index}`;
          const userIndex = index + 1;

          return (
            <Stack alignItems={`center`} key={field.id}>
              <Input
                {...register(`settings.tcp.queryResponse.${index}.expect`)}
                aria-label={`Response to expect ${userIndex}`}
                data-fs-element="TCP query response expect input"
                disabled={isFormDisabled}
                placeholder="Response to expect"
                type="text"
              />
              <TextArea
                {...register(`settings.tcp.queryResponse.${index}.send`)}
                aria-label={`Data to send ${userIndex}`}
                data-fs-element="TCP query response send textarea"
                disabled={isFormDisabled}
                placeholder="Data to send"
                rows={1}
                type="text"
              />
              <Stack alignItems={`center`}>
                <Field label="StartTLS" htmlFor={startTLSId} className={styles.switchField}>
                  <Switch
                    {...register(`settings.tcp.queryResponse.${index}.startTLS`)}
                    aria-label={`Start TLS switch ${userIndex}`}
                    data-fs-element="TCP start TLS switch"
                    disabled={isFormDisabled}
                    id={startTLSId}
                    label="StartTLS"
                  />
                </Field>
              </Stack>
              <IconButton
                data-fs-element="Delete query and response validation button"
                disabled={isFormDisabled}
                name="minus-circle"
                onClick={() => remove(index)}
                tooltip="Delete"
              />
            </Stack>
          );
        })}
        <div>
          <Button
            data-fs-element="Add query response validation button"
            disabled={isFormDisabled}
            onClick={() => append({ expect: '', send: '', startTLS: false })}
            size="sm"
            variant="secondary"
          >
            Add query/response
          </Button>
        </div>
      </Stack>
    </Field>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  switchField: css({
    margin: 0,
    flexDirection: 'row',
    gap: theme.spacing(1),
  }),
});
