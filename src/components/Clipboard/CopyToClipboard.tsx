import React, { useState } from 'react';
import { Button, ButtonVariant } from '@grafana/ui';

interface Props extends React.ComponentProps<typeof Button> {
  content: string;
  buttonText: string;
  buttonTextCopied: string;
  onClipboardCopy?(): void;
  onClipboardError?(err: string): void;

  variant?: ButtonVariant;
}

export const CopyToClipboard = ({
  content,
  onClipboardCopy,
  onClipboardError,
  buttonText,
  buttonTextCopied,
  ...rest
}: Props) => {
  const [copied, setCopied] = useState(false);

  const copyContent = () => {
    if (!navigator.clipboard) {
      onClipboardError && onClipboardError('Clipboard API not available');
      return;
    }
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        onClipboardCopy && onClipboardCopy();
      })
      .catch((err) => {
        onClipboardError && onClipboardError(err);
        console.warn('Failed to copy to clipboard', err);
      });
  };

  return (
    <Button onClick={copyContent} icon={copied ? 'check' : 'clipboard-alt'} {...rest}>
      {copied ? buttonTextCopied : buttonText}
    </Button>
  );
};
