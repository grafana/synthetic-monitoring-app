import React, { useRef, useEffect } from 'react';
import Clipboard from 'clipboard';
import { Button, ButtonVariant } from '@grafana/ui';

interface Props extends React.ComponentProps<typeof Button> {
  getText(): string;
  onClipboardCopy?(e: Clipboard.Event): void;
  onClipboardError?(e: Clipboard.Event): void;

  variant?: ButtonVariant;
}

export const CopyToClipboard = (props: Props) => {
  const clipboardRef = useRef<HTMLButtonElement>(null);
  let clipboard: Clipboard;
  const { getText, onClipboardCopy, onClipboardError, ...rest } = props;

  const initClipboard = () => {
    if (clipboardRef.current) {
      clipboard = new Clipboard(clipboardRef.current, {
        text: () => getText(),
      });
      clipboard.on('success', (e: Clipboard.Event) => {
        onClipboardCopy && onClipboardCopy(e);
      });

      clipboard.on('error', (e: Clipboard.Event) => {
        onClipboardError && onClipboardError(e);
      });
    }
  };

  useEffect(() => {
    if (clipboard) {
      clipboard.destroy();
    }

    initClipboard();

    return () => clipboard.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getText]);

  return (
    <Button {...rest} ref={clipboardRef}>
      {props.children}
    </Button>
  );
};
