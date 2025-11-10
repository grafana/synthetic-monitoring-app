import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, IconButton, Input, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { useDOMId } from '../../../hooks/useDOMId';
import { getHashFromUrl, getUrlWithoutSearchAndHash, toSearchParamEntries } from './QueryParamsEditor.utils';
import { SimpleCard } from './SimpleCard';
import { SimpleDiff } from './SimpleDiff';

interface QueryParamsEditorProps {
  url: string;
  onChange: (url: string) => void;
  onDismissWarning: () => void;
  addButtonText?: ReactNode;
}

export function QueryParamsEditor({
  url,
  onChange,
  onDismissWarning,
  addButtonText = 'Query parameter', // there is a + in front of the text
}: QueryParamsEditorProps) {
  const baseId = useDOMId();
  const styles = useStyles2(getStyles);

  // Example URL for demonstration
  const [isDirty, setIsDirty] = useState(false);
  const entries = useMemo<Array<[string, string]>>(() => {
    setIsDirty(false); // external update means that we are not dirty anymore
    return [...toSearchParamEntries(url), ['', '']]; // Always have an empty entry at the end
  }, [url]);

  useEffect(() => {
    setParams(entries.length > 0 ? entries : [['', '']]);
  }, [entries]);

  const [params, setParams] = useState<Array<[string, string]>>([]);

  const result = useMemo(() => {
    const searchParams = new URLSearchParams();
    params.forEach(([name, value], index) => {
      // Skip last index since it's always empty
      if (index === params.length - 1) {
        return;
      }

      searchParams.append(name, value);
    });
    const paramsString = searchParams.toString();

    if (!paramsString) {
      return url;
    }

    const hash = getHashFromUrl(url);
    const hashValue = hash ? `${hash}` : '';

    return getUrlWithoutSearchAndHash(url) + '?' + searchParams.toString() + hashValue;
  }, [params, url]);

  useEffect(() => {
    if (isDirty && url !== result) {
      onChange(result);
    }
  }, [isDirty, onChange, result, url]);

  const [warning, setWarning] = useState<string | null>(null);

  const isDisabled = warning !== null;

  useEffect(() => {
    if (!isDirty && url !== result) {
      setWarning(
        'The current URL has issues that may affect its final form. You can dismiss this message or click the button below to fix them.'
      );
    } else {
      setWarning(null);
    }
  }, [isDirty, result, url]);

  const handleChange = (event: FormEvent<HTMLInputElement>, key: 'name' | 'value', index: number) => {
    const value = event.currentTarget.value;

    setParams((currentParams) => {
      let addNewAtEnd = index === currentParams.length - 1;

      if (currentParams[index]) {
        const currentItem = currentParams[index];
        if (key === 'name' && currentItem[0] === value) {
          return currentParams;
        }
        if (key === 'value' && currentItem[1] === value) {
          return currentParams;
        }
        setIsDirty(true); // We are dirty now since user changed something
        const newState = [...currentParams];
        newState.splice(index, 1, key === 'name' ? [value, currentParams[index][1]] : [currentParams[index][0], value]);
        if (addNewAtEnd) {
          newState.push(['', '']);
        }

        return newState;
      } else {
        return [...currentParams, [key === 'name' ? value : '', key === 'value' ? value : '']];
      }
    });
  };

  const addEmpty = () => {
    setIsDirty(true); // We are dirty now since user changed something
    setParams(() => {
      return [...params, ['', '']];
    });
  };

  const handleRemove = (index: number) => {
    setParams((currentParams) => {
      if (!currentParams[index]) {
        return currentParams;
      }

      const newState = [...currentParams];
      newState.splice(index, 1);
      setIsDirty(true); // We are dirty now since user changed something

      // TODO: This should not be needed, assuming that we always have an empty entry at the end (which we do)
      // Premature defensive coding
      return newState.length === 0 ? [['', '']] : newState;
    });
  };

  return (
    <div>
      {warning && (
        <SimpleCard
          title="URL issues detected"
          description={warning}
          actions={
            <>
              <Button variant="success" fill="text" onClick={() => setIsDirty(true)}>
                Fix
              </Button>
              <Button variant="secondary" fill="outline" onClick={() => onDismissWarning()}>
                Dismiss
              </Button>
            </>
          }
        >
          <div
            className={css`
              overflow: hidden;
            `}
          >
            <SimpleDiff original={url} modified={result} />
          </div>
        </SimpleCard>
      )}
      <div className={styles.rowContainer}>
        {params.map(([name, value], index) => {
          const isLast = index === params.length - 1;
          return (
            <div key={`entry-${index}`} className={styles.row}>
              <Input
                id={`${baseId}-${index}-name`}
                disabled={isDisabled}
                placeholder="Key"
                type="text"
                value={name}
                onChange={(event) => handleChange(event, 'name', index)}
                aria-label={`Query parameter ${index + 1} name`}
              />
              <Input
                id={`${baseId}-${index}-value`}
                disabled={isDisabled}
                placeholder="Value"
                type="text"
                value={value}
                onChange={(event) => handleChange(event, 'value', index)}
                aria-label={`Query parameter ${index + 1} value`}
              />
              <IconButton
                disabled={isLast || isDisabled}
                className={cx(
                  isLast &&
                    css`
                      visibility: hidden;
                    `
                )}
                aria-label="Remove"
                name="minus"
                onClick={() => handleRemove(index)}
              />
            </div>
          );
        })}
        <div className={styles.buttonContainer}>
          <Button disabled={isDisabled} icon="plus" onClick={addEmpty} variant="secondary" size="sm" type="button">
            {addButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    row: css`
      display: flex;
      justify-content: flex-end;
      gap: ${theme.spacing(1)};
    `,
    rowContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(0.75)};
    `,
    buttonContainer: css`
      padding-top: ${theme.spacing(0.75)};
    `,
  };
}
