import React, { type ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

const docs = {
  probes: `https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/#probes`,
  publicProbes: `https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/public-probes/`,
  privateProbes: `https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/`,
  addPrivateProbe: `https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/#add-a-new-probe-in-your-grafana-instance`,
};

type DocsLinkProps = {
  article: keyof typeof docs;
  children: ReactNode;
  iconPosition?: 'prefix' | 'suffix';
  className?: string;
};

export const DocsLink = ({ article, children, iconPosition = 'suffix', className }: DocsLinkProps) => {
  const styles = useStyles2(getStyles);

  return (
    <a className={cx(styles.link, className)} href={docs[article]} target="_blank" rel="noreferrer">
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
