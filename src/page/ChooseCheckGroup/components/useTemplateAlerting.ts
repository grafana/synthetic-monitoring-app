import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Check, CheckAlertDraft, CheckAlertType } from 'types';
import { canSetUpNotifications } from 'data/initialNotificationSetup';
import { getUserPermissions } from 'data/permissions';
import { QUERY_KEYS } from 'data/useChecks';
import { useLabelMode } from 'data/useLabelMode';
import { useNotificationRouting } from 'data/useNotificationRouting';
import { useAlertAccessControl } from 'hooks/useAlertAccessControl';
import { useSMDS } from 'hooks/useSMDS';
import {
  inspectNotificationRouting,
  NotificationRouting,
} from 'components/CheckForm/AlertsPerCheck/notificationRouting';
import {
  getNotificationSetupEligibility,
  validNotificationEmails,
} from 'components/CheckForm/AlertsPerCheck/notificationSetup';

import { getAvailableCheckName } from './checkNames';
import { templateAlertLabels } from './templateAlerts';

export const TEMPLATE_EMAIL_ERROR = 'Enter valid email addresses separated by commas, semicolons or new lines.';

// Independent of the template's form library or check type. Presets and the
// generated check are the only template-specific inputs.
export function useTemplateAlerting(check: Check, alerts: CheckAlertDraft[]) {
  const smDS = useSMDS();
  const { canReadChecks } = getUserPermissions();
  const { canWriteAlerts } = useAlertAccessControl();
  const routing = useNotificationRouting();
  const labelMode = useLabelMode();
  const checks = useQuery({
    queryKey: [...QUERY_KEYS.list, { includeAlerts: false }],
    queryFn: () => smDS.listChecks(),
    enabled: canReadChecks,
  });
  const [unselected, setUnselected] = useState<CheckAlertType[]>([]);
  const [emails, setEmails] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const selectedAlerts = canWriteAlerts ? alerts.filter(({ name }) => !unselected.includes(name)) : [];
  const eligibility =
    routing.data && !routing.isError
      ? getNotificationSetupEligibility(routing.data.trees, routing.data.contactPoints)
      : undefined;
  const canConfigure = canWriteAlerts && eligibility?.status === 'available' && canSetUpNotifications(eligibility.tree);
  const setupUnavailable =
    !canWriteAlerts ||
    eligibility?.status === 'managed' ||
    (eligibility?.status === 'available' && !canSetUpNotifications(eligibility.tree));

  useEffect(() => {
    // Keep drafts through failed/filtered reads, but never reuse them after a
    // confirmed policy or permission change makes shared setup inappropriate.
    if (setupUnavailable) {
      setEmails('');
      setEmailError(undefined);
    }
  }, [setupUnavailable]);

  const previews = new Map<CheckAlertType, NotificationRouting>();
  for (const alert of selectedAlerts) {
    let preview: NotificationRouting = { status: 'unknown' };
    if (routing.data && !routing.isError && labelMode.data && !labelMode.isError) {
      const candidate = { ...check };
      // Preview empty form values just like the full wizard, then recalculate
      // with the generated name and target as the template details change.
      let nameKnown = !check.job;
      if (check.job && check.target && canReadChecks && checks.data && !checks.isError) {
        candidate.job = getAvailableCheckName(check, checks.data);
        nameKnown = true;
      }
      const labels = templateAlertLabels(candidate, alert, labelMode.data.mode);
      // A hidden check may already own the generated name. Only routes that do
      // not depend on it can be previewed confidently without a check listing.
      if (!nameKnown) {
        delete labels.job;
      }
      preview = inspectNotificationRouting(routing.data.trees, routing.data.contactPoints, labels);
    }
    previews.set(alert.name, preview);
  }

  return {
    alerts,
    selectedAlerts,
    canWriteAlerts,
    canConfigure,
    existingContactPoint: eligibility?.status === 'managed' ? eligibility.existingContactPoint : undefined,
    showEmailInput: canConfigure || (!setupUnavailable && Boolean(emails)),
    isLoading: routing.isLoading || labelMode.isLoading || (canReadChecks && checks.isLoading),
    previews,
    emails,
    emailError,
    setEmails: (value: string) => {
      setEmails(value);
      setEmailError(undefined);
    },
    validateEmails: () => {
      const valid = !selectedAlerts.length || !emails.trim() || validNotificationEmails(emails);
      setEmailError(valid ? undefined : TEMPLATE_EMAIL_ERROR);
      return valid;
    },
    toggleAlert: (name: CheckAlertType) =>
      setUnselected((current) =>
        current.includes(name) ? current.filter((value) => value !== name) : [...current, name]
      ),
  };
}

export type TemplateAlertingState = ReturnType<typeof useTemplateAlerting>;
