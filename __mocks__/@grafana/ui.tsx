// @ts-ignore
window.__react_router_build__ = undefined;

const ui = jest.requireActual('@grafana/ui');
import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const Icon = forwardRef((props, ref) => <svg {...props} />);
Icon.displayName = 'Icon';

interface BigValueProps {
  value: {
    numeric: number;
    text?: string;
    title?: string;
  };
}

export function BigValue({ value }: BigValueProps) {
  return (
    <div>
      {/* {value.numeric} */}
      {value.text && <span>{value.text}</span>}
      {value.title && <label>{value.title}</label>}
    </div>
  );
}

function LinkButton({ children, href, ...props }: any) {
  return (
    <Link to={href} {...props}>
      {children}
    </Link>
  );
}

module.exports = {
  ...ui,
  Icon,
  BigValue,
  LinkButton,
};
