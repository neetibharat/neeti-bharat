'use client';

import { IconDownload } from '@tabler/icons-react';
import { Alert } from '@/components/base/alert/alert';
import { Button, type ButtonProps } from '@/components/base/button/button';
import { useDownload } from '@/lib/hooks/use-download';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

export interface DownloadButtonProps {
  /** The API path after /v1, such as /exports/audit-pack. */
  path: string;
  fallbackName: string;
  label: string;
  color?: ButtonProps['color'];
  size?: ButtonProps['size'];
}

/** A button that downloads a file from the API. A failure shows under it, in words. */
export function DownloadButton({ path, fallbackName, label, color, size }: DownloadButtonProps) {
  const errorMessage = useErrorMessage();
  const { download, isLoading, error } = useDownload(path, fallbackName);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        color={color}
        size={size}
        iconLeading={IconDownload}
        isLoading={isLoading}
        onPress={download}
      >
        {label}
      </Button>
      {error !== null && <Alert tone="error">{errorMessage(error)}</Alert>}
    </div>
  );
}
