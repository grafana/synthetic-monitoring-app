import React, { ComponentProps, Fragment } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface ProtocolSuggestionHintProps {
  suggestions: string[];
  onSelect: (target: string) => void;
  disabled?: boolean;
  // Lets callers add spacing below for their own layout (e.g. when this isn't already separated
  // from the next field by a gap-ed Stack).
  marginBottom?: ComponentProps<typeof Box>['marginBottom'];
}

// Renders a "Did you mean https://x or http://x?" hint next to a URL input, where each candidate
// is clickable. Pair with `getUrlProtocolSuggestions` (from `validation`) to compute `suggestions`.
export function ProtocolSuggestionHint({ suggestions, onSelect, disabled, marginBottom }: ProtocolSuggestionHintProps) {
  const styles = useStyles2(getStyles);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Box marginBottom={marginBottom}>
      <Text variant="bodySmall" color="secondary">
        Did you mean{' '}
        {suggestions.map((suggestion, index) => (
          <Fragment key={suggestion}>
            <button type="button" disabled={disabled} className={styles.link} onClick={() => onSelect(suggestion)}>
              {suggestion}
            </button>
            {index < suggestions.length - 1 && ' or '}
          </Fragment>
        ))}
        ?
      </Text>
    </Box>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    link: css`
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: ${theme.colors.text.link};
      font-size: inherit;

      &:hover,
      &:focus {
        text-decoration: underline;
      }
    `,
  };
}
