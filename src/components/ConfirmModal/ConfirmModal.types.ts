import { ConfirmModalProps } from '@grafana/ui';

export interface ConfirmError {
  name: string;
  message: string;
}

export interface AsyncConfirmModalProps extends Omit<ConfirmModalProps, 'onConfirm'> {
  async: boolean;
  error?: ConfirmError;
  onSuccess?: (response: unknown) => void;
  onError?: (error: ConfirmError) => void;
  onConfirm?: () => Promise<unknown>;
}
