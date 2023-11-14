import React, { type ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

const docs = {
  publicProbes: `https://grafana.com/docs/grafana-cloud/monitor-public-endpoints/probes/`,
  privateProbes: `https://grafana.com/docs/grafana-cloud/monitor-public-endpoints/private-probes/`,
};

type DocsLinkProps = {
  article: keyof typeof docs;
  children: ReactNode;
  iconPosition?: 'prefix' | 'suffix';
};

export const DocsLink = ({ article, children, iconPosition = 'suffix' }: DocsLinkProps) => {
  const styles = useStyles2(getStyles);

  return (
    <a className={styles.link} href={docs[article]} target="_blank" rel="noreferrer">
      {iconPosition === 'prefix' && <ExternalLinkIcon />}
      {children}
      {iconPosition === 'suffix' && <ExternalLinkIcon />}
    </a>
  );
};

const ExternalLinkIcon = () => <Icon name="external-link-alt" size="sm" />;

const getStyles = (theme: GrafanaTheme2) => ({
  link: css({
    alignItems: 'baseline',
    color: theme.colors.text.link,
    display: 'inline-flex',
    gap: theme.spacing(0.5),
    textDecoration: 'underline',

    '&:hover': {
      textDecoration: 'none',
    },
  }),
});
