import React, { FC } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { css } from 'emotion';
import { Field, Input, IconButton, HorizontalGroup, Icon, Button, useTheme } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';

interface Props {
  isEditor: boolean;
  name: string;
  label: string;
  description: string;
}

const getStyles = (theme: GrafanaTheme) => ({
  verticalContainer: css`
    margin-bottom: ${theme.spacing.sm};
    display: flex;
    flex-direction: column;
  `,
  marginBottom: css`
    margin-bottom: ${theme.spacing.sm};
  `,
});

export const BodyRegexMatcherInput: FC<Props> = ({ isEditor, name, label, description }) => {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <Field label={label} description={description} disabled={!isEditor}>
      <>
        <div className={styles.verticalContainer}>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.marginBottom}>
              <HorizontalGroup>
                <Input
                  ref={register()}
                  type="text"
                  name={`${name}[${index}]`}
                  placeholder="regexp"
                  disabled={!isEditor}
                />
                <IconButton name="minus-circle" type="button" disabled={!isEditor} onClick={() => remove(index)} />
              </HorizontalGroup>
            </div>
          ))}
        </div>
        <Button type="button" onClick={() => append({ value: '' })} disabled={!isEditor} variant="secondary" size="sm">
          <HorizontalGroup spacing="sm">
            <Icon name="plus" />
            Add Body Regexp
          </HorizontalGroup>
        </Button>
      </>
    </Field>
  );
};
