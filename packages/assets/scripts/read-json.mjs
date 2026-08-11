import fs from "node:fs";

/** Read UTF-8 JSON, stripping a leading BOM if present (Windows/PowerShell exports). */
export function readJsonFile(filePath) {
  let raw = fs.readFileSync(filePath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }
  return JSON.parse(raw);
}
