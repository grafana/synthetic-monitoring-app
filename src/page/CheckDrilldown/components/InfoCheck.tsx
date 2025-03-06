import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDate } from 'utils';
import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { Info } from 'page/CheckDrilldown/components/Info';
import { InfoAlerts } from 'page/CheckDrilldown/components/InfoAlerts';
import { InfoAssertions } from 'page/CheckDrilldown/components/InfoAssertions';
import { InfoLabels } from 'page/CheckDrilldown/components/InfoLabels';
import { InfoProbe } from 'page/CheckDrilldown/components/InfoProbe';

export const InfoCheck = () => {
  const { check } = useCheckDrilldown();
  const frequency = parseFrequency(check.frequency);
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.borderCard}>
        <Stack direction="column" gap={3}>
          <InfoSection
            icon={`info-circle`}
            value={`Check information`}
            href={generateRoutePath(ROUTES.EditCheck, { id: check.id! })}
            tooltip={`Edit check`}
          >
            <Info label="Check type">{Object.keys(check.settings)[0]}</Info>
            <Info label="Frequency">{frequency}</Info>
            <InfoProbe />
          </InfoSection>

          <InfoSection
            icon={`bell`}
            value={`Alerts`}
            href={generateRoutePath(ROUTES.EditCheck, { id: check.id! })}
            tooltip={`Edit alerts`}
          >
            <InfoAlerts />
          </InfoSection>

          <InfoSection
            icon={`thumbs-up`}
            value={`Assertions`}
            href={generateRoutePath(ROUTES.EditCheck, { id: check.id! })}
            tooltip={`Edit assertions`}
          >
            <InfoAssertions />
          </InfoSection>
          <InfoSection
            icon={`tag-alt`}
            value={`Labels`}
            href={generateRoutePath(ROUTES.EditCheck, { id: check.id! })}
            tooltip={`Edit labels`}
          >
            <InfoLabels check={check} />
          </InfoSection>
        </Stack>
      </div>
      <div>
        {check.created && (
          <Info label="Created">
            <div>{formatDate(check.created * 1000)}</div>
          </Info>
        )}
        {check.updated && (
          <Info label="Last updated">
            <div>{formatDate(check.updated * 1000)}</div>
          </Info>
        )}
      </div>
    </div>
  );
};

type InfoSectionProps = {
  icon: IconName;
  value: string;
  href: string;
  tooltip: string;
};

const InfoSection = ({ children, ...props }: PropsWithChildren<InfoSectionProps>) => {
  return (
    <Stack direction={`column`} gap={1.5}>
      <IconHeadingWithAction {...props} />
      <Stack direction={`column`} gap={0.5}>
        {children}
      </Stack>
    </Stack>
  );
};

const IconHeadingWithAction = ({ icon, value, href, tooltip }: InfoSectionProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.heading}>
      <IconHeading icon={icon} value={value} />
      <LinkButton fill="text" tooltip={tooltip} icon={`pen`} href={href} />
    </div>
  );
};

const IconHeading = ({ icon, value }: { icon: IconName; value: string }) => {
  return (
    <Stack alignItems="center">
      <Icon name={icon} size={'lg'} />
      <Text variant="h4" element="h2">
        {value}
      </Text>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(3)};
    `,
    borderCard: css`
      border: 1px solid ${theme.colors.border.weak};
      padding: ${theme.spacing(2)};
    `,
    heading: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid ${theme.colors.border.weak};
    `,
  };
};

function parseFrequency(frequencyInMS: number) {
  const frequencyInSeconds = frequencyInMS / 1000;
  const frequencyInMinutes = frequencyInSeconds / 60;
  const frequencyInHours = frequencyInMinutes / 60;
  const frequencyInDays = frequencyInHours / 24;

  if (frequencyInDays > 1) {
    return `${frequencyInDays} days`;
  }

  if (frequencyInHours > 1) {
    return `${frequencyInHours} hours`;
  }

  if (frequencyInMinutes > 1) {
    return `${frequencyInMinutes} minutes`;
  }

  return `${frequencyInSeconds} seconds`;
}
