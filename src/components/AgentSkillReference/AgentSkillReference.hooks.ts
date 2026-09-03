import { useCallback, useState } from 'react';
import { trackAgentSkillSectionViewed } from 'features/tracking/agentSkillEvents';
import { useLocalStorage } from 'usehooks-ts';

import {
  AGENT_SKILL_FEEDBACK_GIVEN_STORAGE_KEY,
  AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
  AgentSkillReferenceSource,
} from './AgentSkillReference.constants';

/**
 * Gates the "Did the skill help?" ask. It shows only on return visits after an
 * install command was copied (the flag is snapshotted at mount so a copy in the
 * current session doesn't trigger the ask before the skill has actually been
 * tried), and stops for good once the user has reacted to it.
 */
export function useAgentSkillFeedback() {
  const [hasCopiedInstall, setHasCopiedInstall] = useLocalStorage<boolean>(
    AGENT_SKILL_INSTALL_COPIED_STORAGE_KEY,
    false
  );
  const [feedbackGiven, setFeedbackGiven] = useLocalStorage<boolean>(AGENT_SKILL_FEEDBACK_GIVEN_STORAGE_KEY, false);
  const [askForFeedback] = useState(hasCopiedInstall && !feedbackGiven);

  const markInstallCopied = useCallback(() => setHasCopiedInstall(true), [setHasCopiedInstall]);
  // Persist for future mounts only; the ask stays visible for the rest of this
  // session so the user can still finish the comment form.
  const markFeedbackGiven = useCallback(() => setFeedbackGiven(true), [setFeedbackGiven]);

  return { askForFeedback, markInstallCopied, markFeedbackGiven };
}

// Sources already counted in this page load. Deduped at module level (not per
// component instance) so remounts, e.g. switching Checkster feature tabs back
// and forth, don't inflate the section_viewed metric.
const viewedSources = new Set<AgentSkillReferenceSource>();

/** Test-only: clears the per-page-load section_viewed dedupe between tests. */
export function resetAgentSkillViewedSources() {
  viewedSources.clear();
}

/**
 * Returns a callback that fires the section_viewed event at most once per
 * source per page load. Call it whenever the reference content becomes
 * visible (render, expand, or first tool selection depending on the surface).
 */
export function useTrackAgentSkillSectionViewed(source: AgentSkillReferenceSource) {
  return useCallback(() => {
    if (!viewedSources.has(source)) {
      viewedSources.add(source);
      trackAgentSkillSectionViewed({ source });
    }
  }, [source]);
}
