import React from 'react';

interface ChildrenArgs {
  width: number;
  height: number;
}

interface Props {
  children: (dimensions: ChildrenArgs) => JSX.Element;
}

export const Autosizer = ({ children }: Props) => {
  return <div>{children({ width: 500, height: 500 })}</div>;
};
