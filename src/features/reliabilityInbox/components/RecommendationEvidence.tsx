import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Grid, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { getEvidenceExploreUrl } from '../evidence';
import { ReliabilityOpportunity } from '../model';
import { hasAggregateEvidence } from '../ReliabilityInboxPage.utils';
import { InboxDisclosure } from './InboxDisclosure';

interface RecommendationEvidenceProps {
  opportunity: ReliabilityOpportunity;
}

export function RecommendationEvidence({ opportunity }: RecommendationEvidenceProps) {
  const styles = useStyles2(getStyles);
  const evidenceExploreUrl = getEvidenceExploreUrl(opportunity.suggestion.evidence);
  const showAggregateEvidence = hasAggregateEvidence(opportunity);

  return (
    <section className={styles.panel} aria-labelledby="reliability-inbox-recommendation-evidence-title">
      <Stack direction="column" gap={1.5}>
        <Stack alignItems="center" justifyContent="space-between" gap={1}>
          <Text element="h2" id="reliability-inbox-recommendation-evidence-title" variant="h3">
            Why this recommendation
          </Text>
          {evidenceExploreUrl && (
            <LinkButton href={evidenceExploreUrl} icon="compass" variant="secondary">
              Explore telemetry
            </LinkButton>
          )}
        </Stack>
        <Text element="p">
          {opportunity.requestVolume
            ? `We observed ${opportunity.requestVolume} requests in the last hour, and no matching Synthetic Monitoring check was found.`
            : 'We observed recent traffic, and no matching Synthetic Monitoring check was found.'}
        </Text>
        <Text element="h3" variant="h4">
          Observed traffic evidence
        </Text>
        {showAggregateEvidence && (
          <Text element="p" variant="bodySmall" color="secondary">
            Based on Prometheus telemetry from the last hour.
          </Text>
        )}
        <Grid columns={{ xs: 2, lg: 4 }} gap={1}>
          {opportunity.requestVolume && (
            <EvidenceMetric value={opportunity.requestVolume} label="estimated requests in the last hour" />
          )}
          {opportunity.requestRate && <EvidenceMetric value={opportunity.requestRate} label="observed request rate" />}
          {opportunity.errorRate && <EvidenceMetric value={opportunity.errorRate} label="5xx responses" />}
          {opportunity.p99 && <EvidenceMetric value={opportunity.p99} label="p99 response time" />}
        </Grid>
        {!showAggregateEvidence && (
          <Text element="p" color="secondary" role="status">
            No aggregate traffic values were returned for this suggestion.
          </Text>
        )}
        <div className={styles.coverageAssessment}>
          <Text element="h3" variant="h4">
            Coverage assessment
          </Text>
          <Text element="p" color="secondary">
            We found no matching HTTP check for this endpoint and path among the checks available to us. Indirect or
            inaccessible monitoring may still exist.
          </Text>
          <InboxDisclosure summary="How we checked" inline>
            <p className={styles.disclosureContent}>
              We compared the endpoint and path with accessible HTTP checks. Aliases, redirects, upstream checks, and
              checks for other paths may not match directly.
            </p>
          </InboxDisclosure>
        </div>
      </Stack>
    </section>
  );
}

function EvidenceMetric({ value, label }: { value: string; label: string }) {
  return (
    <Box padding={1.5} borderStyle="solid" borderColor="weak" borderRadius="default" backgroundColor="secondary">
      <Stack direction="column" gap={0.5}>
        <Text variant="h4" weight="bold">
          {value}
        </Text>
        <Text variant="bodySmall" color="secondary">
          {label}
        </Text>
      </Stack>
    </Box>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  panel: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    padding: theme.spacing(2.5),
  }),
  coverageAssessment: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    paddingTop: theme.spacing(1.5),
    '& > p': {
      margin: 0,
    },
  }),
  disclosureContent: css({
    color: theme.colors.text.secondary,
    margin: 0,
    padding: theme.spacing(1, 0, 0, 2.5),
  }),
});
