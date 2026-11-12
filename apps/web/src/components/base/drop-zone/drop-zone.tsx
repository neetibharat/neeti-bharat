'use client';

import { IconUpload } from '@tabler/icons-react';
import {
  DropZone as AriaDropZone,
  FileTrigger,
  Text,
  isFileDropItem,
  type DropItem,
} from 'react-aria-components';
import { Button } from '@/components/base/button/button';
import { Spinner } from '@/components/base/spinner/spinner';
import { cx } from '@/lib/utils/cx';

export interface DropZoneProps {
  /** What the zone says, for example "Drag and drop files here". */
  label: string;
  /** A line beneath it, for example what is accepted. */
  hint?: string;
  /** The label of the button that opens the file picker. */
  buttonLabel: string;
  /** Replaces the label while files are being sent. */
  loadingLabel: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  /** File extensions with a dot, such as `.pdf`, for the file picker. */
  accept?: string[];
  onFiles: (files: File[]) => void;
}

async function filesFrom(items: DropItem[]): Promise<File[]> {
  return Promise.all(items.filter(isFileDropItem).map((item) => item.getFile()));
}

/** A place to drop files or pick them. Keyboard users reach the same thing through its button. */
export function DropZone(props: DropZoneProps) {
  const { label, hint, buttonLabel, loadingLabel, isLoading, isDisabled, accept, onFiles } = props;
  const off = isDisabled || isLoading;

  return (
    <AriaDropZone
      isDisabled={off}
      onDrop={async (event) => onFiles(await filesFrom(event.items))}
      className={({ isDropTarget }) =>
        cx(
          'flex flex-col items-center gap-1 rounded-control border border-dashed px-4 py-6 text-center transition-colors',
          isDropTarget ? 'border-brand bg-info-soft' : 'border-line-strong bg-surface-muted/50',
          isDisabled && 'opacity-70',
        )
      }
    >
      <span className="grid size-9 place-items-center rounded-full bg-surface text-fg-subtle shadow-card">
        {isLoading ? <Spinner /> : <IconUpload className="size-4" />}
      </span>
      <Text slot="label" className="text-label font-medium text-fg">
        {isLoading ? loadingLabel : label}
      </Text>
      {hint && <p className="text-caption text-fg-muted">{hint}</p>}
      <FileTrigger
        allowsMultiple
        acceptedFileTypes={accept}
        onSelect={(list) => list && onFiles(Array.from(list))}
      >
        <Button color="secondary" size="sm" className="mt-2" isDisabled={off}>
          {buttonLabel}
        </Button>
      </FileTrigger>
    </AriaDropZone>
  );
}
