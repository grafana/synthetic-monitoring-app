import { useEffect, useRef, useState } from 'react';

interface UseCopyToClipboardOptions {
  onCopy?(): void;
  onError?(err: unknown): void;
  /** If set, `copied` reverts to false after this many ms. Otherwise it stays true. */
  resetAfterMs?: number;
}

export function useCopyToClipboard({ onCopy, onError, resetAfterMs }: UseCopyToClipboardOptions = {}) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const copy = (text: string) => {
    if (!navigator.clipboard) {
      onError?.('Clipboard API not available');
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        onCopy?.();

        if (resetAfterMs) {
          if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
          }
          resetTimeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs);
        }
      })
      .catch((err) => {
        onError?.(err);
      });
  };

  return { copied, copy };
}
