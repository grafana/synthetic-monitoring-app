import React, { PropsWithChildren } from 'react';
import { AnnotationLayer } from '@grafana/scenes-react';
import { AnnotationQuery } from '@grafana/schema';

interface DashboardContainerAnnotationsProps extends PropsWithChildren {
  annotations: AnnotationQuery[];
}

export const DashboardContainerAnnotations = ({ annotations, children }: DashboardContainerAnnotationsProps) => {
  if (annotations.length === 0) {
    return children;
  }

  return <RecursiveAnnotationLayer annotations={annotations}>{children}</RecursiveAnnotationLayer>;
};

const RecursiveAnnotationLayer = ({ children, annotations }: PropsWithChildren<{ annotations: AnnotationQuery[] }>) => {
  const currentAnnotation = annotations[0];

  if (currentAnnotation) {
    return (
      <AnnotationLayer name={currentAnnotation.name} query={currentAnnotation}>
        <RecursiveAnnotationLayer annotations={annotations.slice(1)}>{children}</RecursiveAnnotationLayer>
      </AnnotationLayer>
    );
  }

  return children;
};
