import { promises as fs } from "node:fs";
import path from "node:path";
import type { MediaStorageProvider } from "@life-community-os/types";

const ROOT = path.join(process.cwd(), ".data", "media-blobs");

function abs(storageKey: string): string {
  const safe = storageKey.replace(/\\/g, "/").replace(/\.\./g, "");
  return path.join(ROOT, ...safe.split("/").filter(Boolean));
}

export function createLocalMediaStorage(): MediaStorageProvider {
  return {
    async upload(input) {
      const target = abs(input.storageKey);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, Buffer.from(input.bytes));
      return { storageKey: input.storageKey, byteLength: input.bytes.byteLength };
    },
    async delete(storageKey) {
      try {
        await fs.unlink(abs(storageKey));
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") throw error;
      }
    },
    async getSignedUrl(storageKey) {
      return `local://${storageKey}`;
    },
    validateAccess(storageKey, tenantId) {
      const prefix = `${tenantId}/`;
      return storageKey.startsWith(prefix) && !storageKey.includes("..");
    },
    async read(storageKey) {
      const buf = await fs.readFile(abs(storageKey));
      return new Uint8Array(buf);
    },
  };
}
