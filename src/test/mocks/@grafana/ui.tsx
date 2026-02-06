import React, { forwardRef, PropsWithChildren } from 'react';
import { DataTestIds } from 'test/dataTestIds';

// Mock Link/TextLink because @grafana/ui uses react-router-dom-v5-compat internally
jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');

  const createRouterLink = (displayName: string) => {
    const Component = forwardRef<HTMLAnchorElement, any>(({ href, children, onClick, external, ...props }, ref) => {
      const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (external || !href || e.defaultPrevented) {
          return;
        }
        e.preventDefault();
        const { locationService } = require('@grafana/runtime');
        locationService.push(href);
      };

      const externalProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

      return (
        <a ref={ref} href={href || '#'} onClick={handleClick} {...externalProps} {...props}>
          {children}
        </a>
      );
    });
    Component.displayName = displayName;
    return Component;
  };

  const Link = createRouterLink('Link');
  const TextLink = createRouterLink('TextLink');

  const CodeEditor = forwardRef<any, any>((props, ref) => (
    <textarea ref={ref} data-testid={DataTestIds.CodeEditor} onChange={props.onChange} value={props.value} />
  ));
  CodeEditor.displayName = 'CodeEditor';

  const Icon = forwardRef<SVGSVGElement, any>((props, _ref) => <svg {...props} />);
  Icon.displayName = 'Icon';

  return {
    ...actual,
    Icon,
    Link,
    TextLink,
    CodeEditor,
    measureText: jest.fn(() => ({ width: 100, height: 14 })),
    BigValue: ({ value }: { value: { numeric: number; text?: string; title?: string } }) => (
      <div>
        {value.text && <span>{value.text}</span>}
        {value.title && <label>{value.title}</label>}
      </div>
    ),
    EmptyState: ({
      variant,
      message,
      button,
      children,
    }: PropsWithChildren<{ variant: string; message: string; button?: React.ReactElement }>) => (
      <div>
        <svg data-testid={`emptyState ${variant}`} />
        <div>
          <span>{message}</span>
        </div>
        {button}
        <div>{children}</div>
      </div>
    ),
  };
});
