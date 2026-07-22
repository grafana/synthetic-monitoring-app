import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AnnotationQuery, DataFrame } from '@grafana/data';
import { useDashboardTime } from 'dashboards/hooks/useDashboardTime';

import { Check } from 'types';

import { annotationFramesToEvents, mergeAnnotationFrames } from './annotationEvents';
import { executeDashboardAnnotationQueries } from './executeDashboardAnnotations';
import { useDashboardContainerAnnotations } from './useDashboardContainerAnnotations';

export type DashboardAnnotationsContextValue = {
  definitions: AnnotationQuery[];
  enabledByName: Record<string, boolean>;
  framesByName: Record<string, DataFrame[]>;
  frames: DataFrame[];
  eventsByName: Record<string, number[][]>;
  setEnabled: (name: string, enabled: boolean) => void;
};

const DashboardAnnotationsContext = createContext<DashboardAnnotationsContextValue | null>(null);

type DashboardAnnotationsProviderProps = PropsWithChildren<{
  check: Check;
  definitions?: AnnotationQuery[];
}>;

export function DashboardAnnotationsProvider({
  check,
  definitions,
  children,
}: DashboardAnnotationsProviderProps) {
  const defaultDefinitions = useDashboardContainerAnnotations(check);
  const resolvedDefinitions = definitions ?? defaultDefinitions;
  const timeRange = useDashboardTime();

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

  useEffect(() => {
    if (resolvedDefinitions.length === 0) {
      setFramesByName({});
      return;
    }

    const controller = new AbortController();

    void executeDashboardAnnotationQueries({
      annotations: resolvedDefinitions,
      timeRange,
      job: check.job,
      instance: check.target,
      signal: controller.signal,
    }).then((nextFrames) => {
      if (!controller.signal.aborted) {
        setFramesByName(nextFrames);
      }
    });

    return () => controller.abort();
  }, [check.job, check.target, resolvedDefinitions, timeRange]);

  const setEnabled = useCallback((name: string, enabled: boolean) => {
    setEnabledByName((current) => ({ ...current, [name]: enabled }));
  }, []);

  const value = useMemo<DashboardAnnotationsContextValue>(() => {
    const enabledFrames = Object.fromEntries(
      Object.entries(framesByName).filter(([name]) => enabledByName[name] !== false)
    );

    return {
      definitions: resolvedDefinitions,
      enabledByName,
      framesByName,
      frames: mergeAnnotationFrames(enabledFrames),
      eventsByName: Object.fromEntries(
        Object.entries(framesByName).map(([name, frames]) => [name, annotationFramesToEvents(frames)])
      ),
      setEnabled,
    };
  }, [enabledByName, framesByName, resolvedDefinitions, setEnabled]);

  return (
    <DashboardAnnotationsContext.Provider value={value}>{children}</DashboardAnnotationsContext.Provider>
  );
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

export function DashboardAnnotationsStaticProvider({
  value,
  children,
}: PropsWithChildren<{ value: DashboardAnnotationsContextValue }>) {
  return <DashboardAnnotationsContext.Provider value={value}>{children}</DashboardAnnotationsContext.Provider>;
}
