import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Icon, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackEvidenceInvestigationClicked } from 'features/tracking/reliabilityInboxEvents';

import { ReliabilityOpportunity } from './types';

import { getEvidenceInvestigationLinks } from './evidence';

interface ReliabilityEvidenceInvestigationProps {
  opportunity: ReliabilityOpportunity;
  showUnavailable?: boolean;
}

export function ReliabilityEvidenceInvestigation({
  opportunity,
  showUnavailable = false,
}: ReliabilityEvidenceInvestigationProps) {
  const styles = useStyles2(getStyles);
  const links = useMemo(
    () =>
      getEvidenceInvestigationLinks(
        opportunity.evidencePrototype,
        opportunity.suggestion.evidence.references,
        config.bootData.user.orgId
      ),
    [opportunity]
  );

  if (links.length === 0) {
    if (!showUnavailable) {
      return null;
    }

    return (
      <div className={styles.unavailable} role="status">
        <Icon name="info-circle" />
        <span>
          A direct investigation link was not included with this recommendation. The telemetry sources used are listed
          below.
        </span>
      </div>
    );
  }

  return (
    <nav className={styles.references} aria-label="Investigate backing evidence">
      <span className={styles.label}>
        <Icon name="database" />
        Investigate this evidence
      </span>
      <span className={styles.links}>
        {links.map((link) => (
          <TextLink
            href={link.href}
            key={`${link.destination}-${link.href}`}
            variant="bodySmall"
            onClick={() =>
              trackEvidenceInvestigationClicked({
                opportunityId: opportunity.id,
                checkType: opportunity.proposedCheck.checkType,
                destination: link.destination,
              })
            }
          >
            {link.label}
          </TextLink>
        ))}
      </span>
    </nav>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  references: css({
    alignItems: 'baseline',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75, 1.5),
  }),
  label: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'inline-flex',
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    gap: theme.spacing(0.75),
    '& > svg': {
      color: theme.colors.info.text,
    },
  }),
  links: css({
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75, 1.5),
  }),
  unavailable: css({
    alignItems: 'flex-start',
    color: theme.colors.text.secondary,
    display: 'flex',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.75),
    lineHeight: 1.4,
    '& > svg': {
      color: theme.colors.info.text,
      flexShrink: 0,
      marginTop: theme.spacing(0.25),
    },
  }),
});
