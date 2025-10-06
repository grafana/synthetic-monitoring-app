import React, { CSSProperties, PropsWithChildren, RefObject } from 'react';
import { cx } from '@emotion/css';

export enum SplitterComponentType {
  Primary = 'primary',
  Secondary = 'secondary',
  Splitter = 'splitter',
  Container = 'container',
}

interface SplitterComponentProps {
  ref: RefObject<HTMLDivElement | null>;
  className: string;
  style?: CSSProperties;
}

function getSplitterClassName(type: SplitterComponentType) {
  switch (type) {
    case SplitterComponentType.Primary:
      return 'splitter-primary';
    case SplitterComponentType.Secondary:
      return 'splitter-secondary';
    case SplitterComponentType.Splitter:
      return 'splitter-handle';
    case SplitterComponentType.Container:
      return 'splitter-container';
    default:
      return undefined;
  }
}

export function createSplitterComponent(containerType: SplitterComponentType, props: SplitterComponentProps) {
  const { className, ...rest } = props;
  const typeClassName = getSplitterClassName(containerType);

  return function SplitterComponent(props: PropsWithChildren) {
    return (
      <div className={cx(className, typeClassName)} {...rest}>
        {props.children}
      </div>
    );
  };
}
