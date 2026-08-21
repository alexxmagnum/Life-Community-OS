"use client";

import { useState } from "react";
import type { MediaEntityType, MediaPurpose } from "@life-community-os/types";
import { MediaGallery, MediaUploader } from "@life-community-os/ui";
import { uploadMediaFile } from "@/lib/media/media-client";

export type EntityMediaFieldProps = {
  entityType?: MediaEntityType;
  entityId?: string;
  purpose?: MediaPurpose;
  type?: "image" | "avatar" | "attachment";
  label?: string;
  onUploaded?: (mediaId: string, url: string) => void;
};

export function EntityMediaField({
  entityType,
  entityId,
  purpose = "cover",
  type = "image",
  label = "Añadir imagen",
  onUploaded,
}: EntityMediaFieldProps) {
  const [items, setItems] = useState<Array<{ id: string; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <MediaUploader
        label={label}
        disabled={busy}
        accept={
          type === "attachment"
            ? "image/jpeg,image/png,image/webp,application/pdf"
            : "image/jpeg,image/png,image/webp,image/gif"
        }
        onFiles={(files) => {
          const file = files[0];
          if (!file) return;
          setBusy(true);
          setError(null);
          void uploadMediaFile({
            file,
            type,
            entityType,
            entityId,
            purpose,
          }).then((result) => {
            setBusy(false);
            if ("error" in result) {
              setError("No se pudo subir el archivo.");
              return;
            }
            setItems((current) => [
              ...current,
              { id: result.asset.id, url: result.url },
            ]);
            onUploaded?.(result.asset.id, result.url);
          });
        }}
      />
      {error ? (
        <p className="text-[13px] text-[var(--color-feedback-danger)]">{error}</p>
      ) : null}
      {items.length > 0 ? <MediaGallery items={items} /> : null}
    </div>
  );
}
