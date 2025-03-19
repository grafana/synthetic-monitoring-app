import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';
import { CheckAlertsSchema } from 'schemas/general/CheckAlerts';
import { CheckProbesSchema } from 'schemas/general/CheckProbes';
import { FrequencySchema } from 'schemas/general/Frequency';
import { JobSchema } from 'schemas/general/Job';
import { LabelsSchema } from 'schemas/general/Label';
import { z, ZodType } from 'zod';

import { AlertSensitivity, CheckFormValuesBase } from 'types';

export const BaseCheckSchema: ZodType<CheckFormValuesBase> = z
  .object({
    job: JobSchema,
    target: z.string(),
    frequency: FrequencySchema,
    id: z.number().optional(),
    timeout: z.number(),
    enabled: z.boolean(),
    probes: CheckProbesSchema,
    alertSensitivity: z.nativeEnum(AlertSensitivity),
    labels: LabelsSchema,
    publishAdvancedMetrics: z.boolean(),
    alerts: CheckAlertsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const { frequency, timeout } = data;
    if (frequency < timeout) {
      ctx.addIssue({
        path: ['frequency'],
        message: `Frequency must be greater than or equal to timeout (${timeout} seconds)`,
        code: z.ZodIssueCode.custom,
      });
    }
  })
  .superRefine((data, ctx) => {
    const { frequency, probes } = data;
    const failedExecutionsAlertPeriod = data.alerts?.ProbeFailedExecutionsTooHigh?.period;
    const failedExecutionsAlertThreshold = data.alerts?.ProbeFailedExecutionsTooHigh?.threshold;
    const isSelected = data.alerts?.ProbeFailedExecutionsTooHigh?.isSelected;

    if (!isSelected || !failedExecutionsAlertPeriod || !failedExecutionsAlertThreshold) {
      return;
    }
    const failedExecutionAlertPeriodInSeconds =
      durationToMilliseconds(parseDuration(failedExecutionsAlertPeriod)) / 1000;
    const totalChecksPerPeriod = getTotalChecksPerPeriod(probes.length, frequency, failedExecutionAlertPeriodInSeconds);

    if (failedExecutionsAlertThreshold > totalChecksPerPeriod) {
      ctx.addIssue({
        path: ['alerts.ProbeFailedExecutionsTooHigh.threshold'],
        message: `Threshold (${failedExecutionsAlertThreshold}) must be lower than or equal to the total number of checks per period (${totalChecksPerPeriod})`,
        code: z.ZodIssueCode.custom,
      });
    }
  });
