import React, { useState } from 'react';
import { Button, ButtonVariant, IconButton } from '@grafana/ui';

interface CopyToClipboardProps extends React.ComponentProps<typeof Button> {
  content: string;
  buttonText: string;
  buttonTextCopied: string;
  onClipboardCopy?(): void;
  onClipboardError?(err: string): void;
  variant?: ButtonVariant;
  iconButton?: boolean;
}

export const CopyToClipboard = ({
  content,
  onClipboardCopy,
  onClipboardError,
  buttonText,
  buttonTextCopied,
  iconButton = false,
  ...rest
}: CopyToClipboardProps) => {
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
      });
  };

  if (iconButton) {
    return (
      <IconButton
        name={copied ? 'check' : 'clipboard-alt'}
        onClick={copyContent}
        tooltip={copied ? buttonTextCopied : buttonText}
      />
    );
  }

  return (
    <Button onClick={copyContent} icon={copied ? 'check' : 'clipboard-alt'} {...rest}>
      {copied ? buttonTextCopied : buttonText}
    </Button>
  );
};
