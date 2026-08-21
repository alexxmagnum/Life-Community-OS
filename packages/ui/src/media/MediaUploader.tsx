"use client";

import { useRef, useState } from "react";
import { cn } from "../lib/cn";
import { Button } from "../actions/Button";

export type MediaUploaderProps = {
  label?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
};

export function MediaUploader({
  label = "Añadir archivo",
  hint = "Imagen, documento o adjunto de la comunidad.",
  accept = "image/jpeg,image/png,image/webp,image/gif,application/pdf",
  multiple = false,
  disabled = false,
  onFiles,
  className,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          setNames(files.map((file) => file.name));
          if (files.length > 0) onFiles(files);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      <p className="text-[13px] text-[var(--color-text-tertiary)]">{hint}</p>
      {names.length > 0 ? (
        <p className="truncate text-[13px] text-[var(--color-text-secondary)]">
          {names.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
