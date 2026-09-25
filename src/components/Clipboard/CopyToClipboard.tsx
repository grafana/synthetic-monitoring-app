import React from 'react';
import { Button, ButtonVariant, IconButton } from '@grafana/ui';

import { useCopyToClipboard } from './useCopyToClipboard';

interface CopyToClipboardProps {
  content: string;
  buttonText: string;
  buttonTextCopied: string;
  onClipboardCopy?(): void;
  onClipboardError?(err: string): void;
  variant?: ButtonVariant;
  iconButton?: boolean;
  className?: string;
  fill?: 'solid' | 'outline' | 'text';
}

export const CopyToClipboard = ({
  content,
  onClipboardCopy,
  onClipboardError,
  buttonText,
  buttonTextCopied,
  iconButton = false,
  className,
  variant,
  fill,
}: CopyToClipboardProps) => {
  const { copied, copy } = useCopyToClipboard({
    onCopy: onClipboardCopy,
    onError: (err) => onClipboardError?.(String(err)),
  });

  if (iconButton) {
    return (
      <IconButton
        name={copied ? 'check' : 'clipboard-alt'}
        onClick={() => copy(content)}
        tooltip={copied ? buttonTextCopied : buttonText}
      />
    );
  }

  return (
    <Button
      onClick={() => copy(content)}
      icon={copied ? 'check' : 'clipboard-alt'}
      className={className}
      variant={variant}
      fill={fill}
    >
      {copied ? buttonTextCopied : buttonText}
    </Button>
  );
};
