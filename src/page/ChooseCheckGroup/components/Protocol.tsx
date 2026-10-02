import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tag, TextLink, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { ProtocolOption } from 'hooks/useCheckTypeGroupOptions';
import { Toggletip } from 'components/Toggletip';

const GREY_TAG_COLOR_INDEX = 9;

function ProtocolTag({ name, clickable }: { name: string; clickable?: boolean }) {
  const styles = useStyles2(getStyles);
  return <Tag className={cx(styles.tag, clickable && styles.tagClickable)} colorIndex={GREY_TAG_COLOR_INDEX} name={name} />;
}

export const Protocol = ({ href, label, tooltip, onClick }: ProtocolOption) => {
  const styles = useStyles2(getStyles);

  if (tooltip) {
    return (
      <Toggletip content={<div>{tooltip}</div>}>
        <button className={styles.tagButton} type="button">
          <ProtocolTag name={label} clickable />
          <Icon name="info-circle" size="sm" />
        </button>
      </Toggletip>
    );
  }

  if (href) {
    return (
      <TextLink className={styles.tagLink} color="secondary" href={href} inline={false} onClick={onClick}>
        <ProtocolTag name={label} clickable />
      </TextLink>
    );
  }

  return <ProtocolTag name={label} />;
};

const getStyles = (theme: GrafanaTheme2) => ({
  tag: css({
    '&&': {
      display: 'inline-flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      height: theme.spacing(3),
      padding: `0 ${theme.spacing(1)}`,
      lineHeight: 1,
      backgroundColor: theme.colors.secondary.main,
      border: `1px solid ${theme.colors.border.medium}`,
      color: theme.colors.text.primary,
    },
  }),
  tagClickable: css({
    '&&:hover': {
      backgroundColor: theme.colors.action.hover,
      borderColor: theme.colors.border.strong,
    },
  }),
  tagButton: css({
    display: 'inline-flex',
    alignItems: 'center',
    height: theme.spacing(3),
    gap: theme.spacing(0.5),
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  }),
  tagLink: css({
    display: 'inline-flex',
    alignItems: 'center',
    height: theme.spacing(3),
    lineHeight: 1,
    textDecoration: 'none',

    '&:hover': {
      textDecoration: 'none',
    },
  }),
});
