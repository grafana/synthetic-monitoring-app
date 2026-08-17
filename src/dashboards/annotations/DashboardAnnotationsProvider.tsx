import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AnnotationQuery, DataFrame } from '@grafana/data';
import { useDashboardTime } from 'dashboards/hooks/useDashboardTime';

import { Check } from 'types';
import { useAppTimeOptional } from 'contexts/AppTimeProvider';
import { DEFAULT_APP_TIMEZONE } from 'contexts/AppTimeProvider.utils';
import { alertNamesMatch } from 'data/grafanaAlertName';

import {
  annotationFramesToEvents,
  annotationFramesToNamedAlertEpisodes,
  mergeAnnotationFrames,
  NamedAlertEpisode,
} from './annotationEvents';
import { executeDashboardAnnotationQueries } from './executeDashboardAnnotations';
import { useDashboardContainerAnnotations } from './useDashboardContainerAnnotations';

export type DashboardAnnotationsContextValue = {
  definitions: AnnotationQuery[];
  enabledByName: Record<string, boolean>;
  framesByName: Record<string, DataFrame[]>;
  frames: DataFrame[];
  eventsByName: Record<string, number[][]>;
  alertEpisodesByName: Record<string, NamedAlertEpisode[]>;
  setEnabled: (name: string, enabled: boolean) => void;
};

const DashboardAnnotationsContext = createContext<DashboardAnnotationsContextValue | null>(null);

type DashboardAnnotationsProviderProps = PropsWithChildren<{
  check: Check;
  definitions?: AnnotationQuery[];
}>;

export function DashboardAnnotationsProvider({ check, definitions, children }: DashboardAnnotationsProviderProps) {
  const defaultDefinitions = useDashboardContainerAnnotations(check);
  const resolvedDefinitions = definitions ?? defaultDefinitions;
  const timeRange = useDashboardTime();
  const timezone = useAppTimeOptional()?.timezone ?? DEFAULT_APP_TIMEZONE;

  const [enabledByName, setEnabledByName] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(resolvedDefinitions.map((definition) => [definition.name!, definition.enable !== false]))
  );
  const [framesByName, setFramesByName] = useState<Record<string, DataFrame[]>>({});

  useEffect(() => {
    setEnabledByName((current) => {
      const next = { ...current };

      for (const definition of resolvedDefinitions) {
        if (definition.name && next[definition.name] === undefined) {
          next[definition.name] = definition.enable !== false;
        }
      }

      return next;
    });
  }, [resolvedDefinitions]);

  const timeFromMs = timeRange.from.valueOf();
  const timeToMs = timeRange.to.valueOf();

  useEffect(() => {
    if (resolvedDefinitions.length === 0) {
      setFramesByName({});
      return;
    }

    const controller = new AbortController();
    let active = true;

    void executeDashboardAnnotationQueries({
      annotations: resolvedDefinitions,
      timeRange,
      timezone,
      job: check.job,
      instance: check.target,
      signal: controller.signal,
    })
      .then((nextFrames) => {
        if (active && !controller.signal.aborted) {
          setFramesByName(nextFrames);
        }
      })
      .catch(() => {
        // Aborted/in-flight failures should not clear a later successful result.
      });

    return () => {
      active = false;
      controller.abort();
    };
    // Depend on stable time millis rather than the TimeRange object identity so
    // we do not abort in-flight annotation queries on incidental rerenders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timeFromMs/timeToMs track timeRange
  }, [check.job, check.target, resolvedDefinitions, timeFromMs, timeToMs, timezone]);

  const setEnabled = useCallback((name: string, enabled: boolean) => {
    setEnabledByName((current) => ({ ...current, [name]: enabled }));
  }, []);

  const value = useMemo<DashboardAnnotationsContextValue>(() => {
    const enabledFrames = Object.fromEntries(
      Object.entries(framesByName).filter(([name]) => enabledByName[name] !== false)
    );
    const colorsByLayer = Object.fromEntries(
      resolvedDefinitions.map((definition) => [definition.name, definition.iconColor])
    );

    return {
      definitions: resolvedDefinitions,
      enabledByName,
      framesByName,
      frames: mergeAnnotationFrames(enabledFrames, colorsByLayer),
      eventsByName: Object.fromEntries(
        Object.entries(framesByName).map(([name, frames]) => [name, annotationFramesToEvents(frames)])
      ),
      alertEpisodesByName: Object.fromEntries(
        Object.entries(framesByName).map(([name, frames]) => [name, annotationFramesToNamedAlertEpisodes(frames)])
      ),
      setEnabled,
    };
  }, [enabledByName, framesByName, resolvedDefinitions, setEnabled]);

  return <DashboardAnnotationsContext.Provider value={value}>{children}</DashboardAnnotationsContext.Provider>;
}

export function useDashboardAnnotationsOptional(): DashboardAnnotationsContextValue | null {
  return useContext(DashboardAnnotationsContext);
}

export function useDashboardAnnotationFrames(): DataFrame[] {
  return useDashboardAnnotationsOptional()?.frames ?? [];
}

export function useDashboardAnnotationEvents(name: string): number[][] {
  const context = useDashboardAnnotationsOptional();

  if (!context || context.enabledByName[name] === false) {
    return [];
  }

  return context.eventsByName[name] ?? [];
}

export function useDashboardAnnotationEventsForTpe() {
  const firing = useDashboardAnnotationEvents('Show alerts firing');
  const pending = useDashboardAnnotationEvents('Show alerts pending');

  return { firing, pending };
}

export function useDashboardAlertEpisodesForTpe() {
  const context = useDashboardAnnotationsOptional();
  const firingName = 'Show alerts firing';
  const pendingName = 'Show alerts pending';

  if (!context) {
    return { firing: [], pending: [] };
  }

  return {
    firing: context.enabledByName[firingName] === false ? [] : (context.alertEpisodesByName[firingName] ?? []),
    pending: context.enabledByName[pendingName] === false ? [] : (context.alertEpisodesByName[pendingName] ?? []),
  };
}

export function useDashboardAlertEpisodes(alertName: string, annotationName?: string): NamedAlertEpisode[] {
  const context = useDashboardAnnotationsOptional();

  if (!context) {
    return [];
  }

  const episodeGroups = annotationName
    ? [context.alertEpisodesByName[annotationName] ?? []]
    : Object.values(context.alertEpisodesByName);

  return episodeGroups.flat().filter((episode) => alertNamesMatch(episode.alertName, alertName));
}

export function DashboardAnnotationsStaticProvider({
  value,
  children,
}: PropsWithChildren<{ value: DashboardAnnotationsContextValue }>) {
  return <DashboardAnnotationsContext.Provider value={value}>{children}</DashboardAnnotationsContext.Provider>;
}
