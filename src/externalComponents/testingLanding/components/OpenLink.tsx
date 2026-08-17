import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface OpenLinkProps {
  href: string;
  label?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function OpenLink({ href, label = 'Open', onClick }: OpenLinkProps) {
  const styles = useStyles2(getStyles);

  return (
    <TextLink
      href={href}
      inline={false}
      variant="bodySmall"
      className={styles.openLink}
      data-testing-synthetics-open-link
      onClick={onClick}
    >
      <span className={styles.label}>{label}</span>
      <Icon name="arrow-right" className={styles.arrow} />
    </TextLink>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const label = css({
    label: 'testing-synthetics-open-label',
    textDecoration: 'none',
  });

  return {
    openLink: css({
      label: 'testing-synthetics-open-link',
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      marginLeft: theme.spacing(0.5),
      color: theme.colors.text.link,
      textDecoration: 'none',
      transition: 'color 150ms ease-out',
      '&:hover': {
        color: theme.colors.text.link,
        textDecoration: 'none',
      },
      [`&:hover .${label}`]: {
        textDecoration: 'underline',
      },
      '&:hover svg': {
        transform: 'translateX(2px)',
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.colors.text.link}`,
        outlineOffset: '2px',
        textDecoration: 'none',
      },
      '&:focus:not(:focus-visible)': {
        outline: 'none',
      },
    }),
    label,
    arrow: css({
      label: 'testing-synthetics-open-arrow',
      width: 14,
      height: 14,
      transition: 'transform 150ms ease-out',
    }),
  };
}
