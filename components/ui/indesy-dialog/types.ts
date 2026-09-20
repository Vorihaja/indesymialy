export type IndesyDialogTone =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

interface IndesyDialogBaseOptions {
  title: string;
  description?: string;
  tone?: IndesyDialogTone;
}

export interface IndesyAlertOptions
  extends IndesyDialogBaseOptions {
  confirmLabel?: string;
}

export interface IndesyConfirmOptions
  extends IndesyDialogBaseOptions {
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface IndesyPromptOptions
  extends IndesyDialogBaseOptions {
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  validate?: (
    value: string,
  ) => string | null;
}

export interface IndesyDialogApi {
  alert(
    options: IndesyAlertOptions,
  ): Promise<void>;
  confirm(
    options: IndesyConfirmOptions,
  ): Promise<boolean>;
  prompt(
    options: IndesyPromptOptions,
  ): Promise<string | null>;
}

export type IndesyDialogRequest =
  | {
      id: number;
      kind: 'alert';
      options: IndesyAlertOptions;
      resolve: () => void;
    }
  | {
      id: number;
      kind: 'confirm';
      options: IndesyConfirmOptions;
      resolve: (value: boolean) => void;
    }
  | {
      id: number;
      kind: 'prompt';
      options: IndesyPromptOptions;
      resolve: (
        value: string | null,
      ) => void;
    };

export type IndesyDialogResolution =
  | {
      id: number;
      kind: 'alert';
    }
  | {
      id: number;
      kind: 'confirm';
      value: boolean;
    }
  | {
      id: number;
      kind: 'prompt';
      value: string | null;
    };
