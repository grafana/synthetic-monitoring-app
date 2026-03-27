import React, { cloneElement, ComponentProps, ReactElement, ReactNode, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { IconButton, Portal, Toggletip as GrafanaToggletip, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface ToggletipProps extends Omit<ComponentProps<typeof GrafanaToggletip>, 'content'> {
  content: ReactNode;
  contentClassName?: string;
  children: ReactElement;
  /** @default 'absolute' — use 'fixed' only when the trigger is NOT inside a containerType ancestor */
  strategy?: 'absolute' | 'fixed';
}

/**
 * Click-to-toggle popover using floating-ui with `strategy: 'absolute'`.
 *
 * The Grafana Toggletip hardcodes `strategy: 'fixed'` which breaks when the
 * trigger is inside a `containerType: 'inline-size'` ancestor (creates a
 * containing block that corrupts fixed-position calculations).
 *
 * `cloneElement` attaches the ref + interaction props directly to the child
 * element, avoiding a wrapper node that would affect flex/grid layouts.
 */
export const Toggletip = ({ children, content, contentClassName, strategy = 'absolute' }: ToggletipProps) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const arrowRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const { context, refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom',
    middleware: [offset(8), flip({ fallbackAxisSideDirection: 'end' }), shift(), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
    strategy,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([useClick(context), useDismiss(context)]);

  return (
    <>
      {cloneElement(children, {
        ref: refs.setReference,
        tabIndex: 0,
        'aria-expanded': isOpen,
        ...getReferenceProps(),
      })}
      {isOpen && (
        <Portal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={styles.container}
            data-testid="toggletip-content"
            {...getFloatingProps()}
          >
            <FloatingArrow
              ref={arrowRef}
              context={context}
              fill={theme.colors.background.primary}
              stroke={theme.colors.border.weak}
              strokeWidth={0.3}
            />
            <div className={styles.close}>
              <IconButton aria-label="Close" name="times" onClick={() => setIsOpen(false)} />
            </div>
            <div className={cx(styles.body, contentClassName)}>{content}</div>
          </div>
        </Portal>
      )}
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    backgroundColor: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    boxShadow: theme.shadows.z2,
    color: theme.components.tooltip.text,
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(2),
    zIndex: theme.zIndex.tooltip,
    maxWidth: '400px',
    overflowWrap: 'break-word',
  }),
  close: css({
    color: theme.colors.text.secondary,
    position: 'absolute',
    right: theme.spacing(0.5),
    top: theme.spacing(1),
  }),
  body: css({
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  }),
});
